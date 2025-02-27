;; kyc-registry.clar
;; Registry Contract - Manages approved verifiers and verified users
 
;; Constants
(define-constant contract-owner tx-sender)
(define-constant err-not-authorized (err u100))
(define-constant err-invalid-user (err u101))
 
;; Data structures
(define-map verifiers
  { verifier: principal }
  { approved: bool, timestamp: uint })
 
(define-map verified-users
  { user: principal }
  { verified: bool, timestamp: uint })
 
;; Public functions
(define-public (apply-for-verifier)
  (let ((applicant tx-sender))
    (asserts! (not (is-verifier applicant)) err-not-authorized)
    (ok (map-set verifiers
                { verifier: applicant }
                { approved: false, timestamp: block-height }))))
 
;; Admin functions
(define-public (approve-verifier (verifier principal))
  (begin
    (asserts! (is-eq tx-sender contract-owner) err-not-authorized)
    (ok (map-set verifiers
                { verifier: verifier }
                { approved: true, timestamp: block-height }))))
 
(define-public (revoke-verifier (verifier principal))
  (begin
    (asserts! (is-eq tx-sender contract-owner) err-not-authorized)
    (ok (map-set verifiers
                { verifier: verifier }
                { approved: false, timestamp: block-height }))))
 
;; For authorized verifiers to update user status
(define-public (verify-user (user principal))
  (begin
    (asserts! (is-verifier tx-sender) err-not-authorized)
    (ok (map-set verified-users
                { user: user }
                { verified: true, timestamp: block-height }))))
 
(define-public (unverify-user (user principal))
  (begin
    (asserts! (is-verifier tx-sender) err-not-authorized)
    (ok (map-set verified-users
                { user: user }
                { verified: false, timestamp: block-height }))))
 
;; Read-only functions
(define-read-only (is-verifier (verifier principal))
  (default-to false (get approved (map-get? verifiers { verifier: verifier }))))
 
(define-read-only (is-verified (user principal))
  (default-to false (get verified (map-get? verified-users { user: user }))))
