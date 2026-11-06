# Sample Prompts for APEX Page Validations

Template reminder
- Before drafting validations, start from the reference skeleton defined in:
  - `templates/business-logic/validations/validations._index.md`
  - `templates/business-logic/validations/validations._common.md`

## A. Required value prompts
1. "Add validations so page items `P20_FIRST_NAME` and `P20_LAST_NAME` must both be populated before submit."
2. "Check that `P50_AMOUNT` is provided and return 'Amount is required' when missing."

## B. Expression comparisons / ranges
3. "Create a validation ensuring `P80_END_DATE` is on or after `P80_START_DATE`, with error 'End Date must not precede Start Date'."
4. "Require `P35_QUANTITY` to be between 1 and 999 using a single expression validation."

## C. Function body logic
5. "If `P40_STATUS` is not null, make `P40_DECISION_DATE` mandatory; otherwise skip. Return a clear message when it fails."
6. "Validate `P60_CODE`: at least three characters and no spaces. Return an explanatory error."

## D. Regex/format checks
7. "Enforce email format on `P10_EMAIL` using `REGEXP_LIKE`; message 'Enter a valid corporate email address'."
8. "Validate `P25_PHONE` to accept only digits and optional plus sign."

## E. Lookup/existence checks
9. "Ensure `P70_CUSTOMER_ID` exists in CUSTOMER_MASTER; if not, return 'Customer ID not found'."
10. "Validate `P15_DEPT_CODE` by calling `APP_VALIDATION.check_dept(:P15_DEPT_CODE)` and surface returned message."

## F. Multi-step sequencing
11. "Add sequence 10 required, sequence 20 minimum length, and sequence 30 custom business logic validations on `P90_SERIAL`."
12. "Combine two validations on `P45_USER`: first not null, then ensure value differs from `P45_OLD_USER`."
