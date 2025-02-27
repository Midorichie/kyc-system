;; kyc-verifier.clar
;; Verifier Contract - Handles verification logic and approved verifiers
 
;; Constants
(define-constant contract-owner tx-sender)
(define-constant err-not-authorized (err u300))
(define-constant err-invalid-verification (err u301))
(define-constant err-no-consent (err u302))
(define-constant err-expired-verification (err u303))
(define-constant err-verification-limit-exceeded (err u304))
 
;; Data structures
(define-map verification-records
  { user: principal, verifier: principal }
  { status: bool, timestamp: uint, expiry: uint, revoked: bool })
 
(define-map verification-counters
  { verifier: principal }
  { count: uint })
 
(define-map verification-limits
  { verifier: principal }
  { limit: uint })
 
;; Public functions
(define-public (verify-identity (user principal) (expiry-blocks uint))
  (let
    ((verifier tx-sender))
   
    ;; Check if verifier is approved - commented out until registry contract is deployed
    ;; (asserts! (contract-call? .kyc-registry is-verifier verifier) err-not-authorized)
  
    ;; Check if user gave consent - commented out until user contract is deployed
    ;; (asserts! (contract-call? .kyc-user has-consent user u"kyc-verification" verifier) err-no-consent)
  
    ;; Check verification limits
    (asserts! (< (get-verification-count verifier) (get-verification-limit verifier)) err-verification-limit-exceeded)
  
    ;; Set verification record
    (map-set verification-records
      { user: user, verifier: verifier }
      { status: true,
        timestamp: block-height,
        expiry: (+ block-height expiry-blocks),
        revoked: false })
  
    ;; Increment counter
    (increment-verification-count verifier)
  
    ;; Call registry contract to update verified status - commented out until registry contract is deployed
    ;; (contract-call? .kyc-registry verify-user user)
   
    (ok true)))
 
(define-public (revoke-verification (user principal))
  (let
    ((verifier tx-sender)
     (record (map-get? verification-records { user: user, verifier: verifier })))
  
    (asserts! (is-some record) err-invalid-verification)
    (ok (map-set verification-records
        { user: user, verifier: verifier }
        { status: false,
          timestamp: block-height,
          expiry: (get expiry (unwrap-panic record)),
          revoked: true }))))
 
;; Private functions
(define-private (increment-verification-count (verifier principal))
  (let ((current-count (get-verification-count verifier)))
    (map-set verification-counters
      { verifier: verifier }
      { count: (+ current-count u1) })))
 
;; Read-only functions
(define-read-only (get-verification-status (user principal) (verifier principal))
  (let ((record (map-get? verification-records { user: user, verifier: verifier })))
    (if (is-some record)
      (let ((unwrapped (unwrap-panic record)))
        (and
          (get status unwrapped)
          (not (get revoked unwrapped))
          (<= block-height (get expiry unwrapped))))
      false)))
 
(define-read-only (get-verification-count (verifier principal))
  (default-to u0 (get count (map-get? verification-counters { verifier: verifier }))))
 
(define-read-only (get-verification-limit (verifier principal))
  (default-to u1000 (get limit (map-get? verification-limits { verifier: verifier }))))
 
;; Admin functions
(define-public (set-verification-limit (verifier principal) (limit uint))
  (begin
    (asserts! (is-eq tx-sender contract-owner) err-not-authorized)
    (ok (map-set verification-limits { verifier: verifier } { limit: limit }))))
 
(define-public (reset-verification-count (verifier principal))
  (begin
    (asserts! (is-eq tx-sender contract-owner) err-not-authorized)
    (ok (map-set verification-counters { verifier: verifier } { count: u0 }))))
