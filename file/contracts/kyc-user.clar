;; kyc-user.clar
;; User Identity Contract - Manages user identity data and consent

;; Constants
(define-constant contract-owner tx-sender)
(define-constant err-not-authorized (err u200))
(define-constant err-data-not-found (err u201))
(define-constant err-consent-not-given (err u202))
(define-constant err-invalid-data-key (err u203))
(define-constant err-invalid-operation (err u204))

;; Data structures
(define-map user-data
  { user: principal, data-key: (string-utf8 50) }
  { data-hash: (buff 32), timestamp: uint, consent-given: (list 10 principal) })

(define-map data-key-registry
  { key: (string-utf8 50) }
  { valid: bool, description: (string-utf8 100) })

;; Public functions
(define-public (store-data (data-key (string-utf8 50)) (data-hash (buff 32)))
  (let ((user tx-sender))
    (asserts! (is-valid-data-key data-key) err-invalid-data-key)
    (ok (map-set user-data
                { user: user, data-key: data-key }
                { data-hash: data-hash,
                  timestamp: block-height,
                  consent-given: (list) }))))

(define-public (grant-consent (data-key (string-utf8 50)) (verifier principal))
  (let
    ((user tx-sender)
     (data-record (get-user-data-record user data-key)))
  
    (asserts! (is-some data-record) err-data-not-found)
    (let ((current-consents (get consent-given (unwrap-panic data-record))))
      (asserts! (< (len current-consents) u9) err-invalid-operation)
      (ok (map-set user-data
                  { user: user, data-key: data-key }
                  { data-hash: (get data-hash (unwrap-panic data-record)),
                    timestamp: block-height,
                    consent-given: (append current-consents verifier) })))))

;; Function to remove a specific verifier from consent list
(define-private (remove-from-consent (consent-list (list 10 principal)) (to-remove principal))
  (fold (lambda (current result)
          (if (is-eq current to-remove)
              result
              (unwrap-panic (as-max-len? (append result (list current)) u10))))
        consent-list
        (list)))

(define-public (revoke-consent (data-key (string-utf8 50)) (verifier principal))
  (let
    ((user tx-sender)
     (data-record (get-user-data-record user data-key)))
  
    (asserts! (is-some data-record) err-data-not-found)
    (let ((current-record (unwrap-panic data-record)))
      (ok (map-set user-data
                  { user: user, data-key: data-key }
                  { data-hash: (get data-hash current-record),
                    timestamp: block-height,
                    consent-given: (remove-from-consent (get consent-given current-record) verifier) }))))))

;; Read-only functions
(define-read-only (has-consent (user principal) (data-key (string-utf8 50)) (verifier principal))
  (let ((data-record (get-user-data-record user data-key)))
    (if (is-some data-record)
        (has-consent-for-verifier (unwrap-panic data-record) verifier)
        false)))

(define-private (has-consent-for-verifier (record { data-hash: (buff 32), timestamp: uint, consent-given: (list 10 principal) }) (verifier principal))
  (default-to false (index-of (get consent-given record) verifier)))

(define-read-only (get-user-data-record (user principal) (data-key (string-utf8 50)))
  (map-get? user-data { user: user, data-key: data-key }))

(define-read-only (is-valid-data-key (key (string-utf8 50)))
  (default-to false (get valid (map-get? data-key-registry { key: key }))))

;; Admin functions
(define-public (register-data-key (key (string-utf8 50)) (description (string-utf8 100)))
  (begin
    (asserts! (is-eq tx-sender contract-owner) err-not-authorized)
    (ok (map-set data-key-registry { key: key } { valid: true, description: description }))))

(define-public (deactivate-data-key (key (string-utf8 50)))
  (begin
    (asserts! (is-eq tx-sender contract-owner) err-not-authorized)
    (ok (map-set data-key-registry { key: key } { valid: false, description: "Deactivated" })))))
