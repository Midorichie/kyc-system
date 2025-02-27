;; kyc-registry.clar
;; KYC Registry Contract for Stacks Blockchain

;; Constants
(define-constant contract-owner tx-sender)
(define-constant err-not-authorized (err u100))
(define-constant err-already-registered (err u101))
(define-constant err-not-registered (err u102))

;; Data maps
(define-map kyc-status 
  { user: principal } 
  { verified: bool, timestamp: uint, verifier: principal })

(define-map approved-verifiers
  { verifier: principal }
  { active: bool, name: (string-utf8 50) })

;; Public functions
(define-public (register-user)
  (let ((user tx-sender))
    (if (is-registered user)
        err-already-registered
        (ok (map-set kyc-status {user: user} {verified: false, timestamp: u0, verifier: contract-owner})))))

(define-public (verify-user (user principal))
  (let ((verifier tx-sender))
    (if (and (is-verifier verifier) (is-registered user))
        (ok (map-set kyc-status {user: user} 
                     {verified: true, timestamp: block-height, verifier: verifier}))
        err-not-authorized)))

;; Read-only functions
(define-read-only (is-registered (user principal))
  (is-some (map-get? kyc-status {user: user})))

(define-read-only (is-verified (user principal))
  (default-to false (get verified (map-get? kyc-status {user: user}))))

(define-read-only (is-verifier (verifier principal))
  (default-to false (get active (map-get? approved-verifiers {verifier: verifier}))))

;; Admin functions
(define-public (add-verifier (verifier principal) (name (string-utf8 50)))
  (begin
    (asserts! (is-eq tx-sender contract-owner) err-not-authorized)
    (ok (map-set approved-verifiers {verifier: verifier} {active: true, name: name}))))

(define-public (remove-verifier (verifier principal))
  (begin
    (asserts! (is-eq tx-sender contract-owner) err-not-authorized)
    (ok (map-set approved-verifiers {verifier: verifier} {active: false, name: u"Inactive"}))))
