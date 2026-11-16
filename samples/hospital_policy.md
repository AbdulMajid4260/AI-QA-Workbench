# Seabrook Training Hospital — synthetic QA source
Version 1.0. This fictional document is for software testing practice only.

## VIS-01: Visitor access
General visiting hours are 16:00 to 18:00 daily. A patient may have at most two concurrent visitors. A third simultaneous visitor must be denied entry. One registered overnight attendant is allowed per patient. The attendant is managed separately from the two visitor slots.
A visitor pass is valid only on its issue date and expires at 23:59:59 Asia/Kolkata. Expired passes must be rejected. Visitor slot allocation must be atomic: if two visitors compete for the final available slot, exactly one may be admitted.
The daily parking fee is not specified in this policy. Do not invent a fee.

## LAB-01: Laboratory targets
The reporting target for a CBC is six hours after sample acceptance. The reporting target for biochemistry is twelve hours after sample acceptance. A rejected sample must be reported to the requesting department within thirty minutes. These are service targets, not patient-specific guarantees.

## FIN-01: Refund administration
An approved refund must be processed within seven working days. Refund calculations and eligibility are outside this document. All patient and payment identifiers used in tests must be synthetic.

## QA examples
Positive: a visitor with a valid same-day pass arrives at 17:00 when one visitor is present; admit the visitor.
Negative: a visitor arrives at 17:00 when two visitors are already present; deny admission.
Boundary: two entry requests compete for one remaining slot; admit exactly one.
Evidence absent: asked for a parking fee; answer that the document does not specify it.
