# Sample Prompts for APEX Page Validations
### A. Basic “required value” prompts

1. “Add validations so that page items `P20_FIRST_NAME` and `P20_LAST_NAME` must both be populated before submit.”
2. “Check that `P50_AMOUNT` is provided—return the message ‘Amount is required’ when it’s missing.”

### B. Expression-based comparisons / ranges

3. “Create a validation ensuring `P80_END_DATE` is on or after `P80_START_DATE`, with the error ‘End Date must not precede Start Date’.”
4. “Require that `P35_QUANTITY` is between 1 and 999. Use a single expression validation.”

### C. Function body with conditional logic

5. “If `P40_STATUS` is not null, make `P40_DECISION_DATE` mandatory; otherwise skip. Return a clear message when it fails.”
6. “Validate `P60_CODE`: it must be at least three characters and not contain spaces. Return an error message describing the rule.”

### D. Regex/format checks

7. “Enforce email format on `P10_EMAIL` using `REGEXP_LIKE`—message ‘Enter a valid corporate email address’.”
8. “Add a validation for `P25_PHONE` to accept only digits and optional plus sign.”

### E. Lookup / existence check (functionBody)

9. “Ensure `P70_CUSTOMER_ID` exists in CUSTOMER_MASTER; if not, return ‘Customer ID not found’.”
10. “Validate `P15_DEPT_CODE` by calling `APP_VALIDATION.check_dept(:P15_DEPT_CODE)`; surface any returned message.”

### F. Multi-step / sequenced tests

11. “Add a sequence 10 validation for ‘required’, sequence 20 for ‘minimum length’, and sequence 30 for ‘custom business logic’ on `P90_SERIAL`.”
12. “Combine two validations on `P45_USER`: first check not null, then ensure value differs from `P45_OLD_USER`.”
