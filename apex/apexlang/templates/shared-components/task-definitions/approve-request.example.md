---
templateId: shared-components.task-definitions.approve-request.example
componentType: markdown-apexlang-example
version: 1.0
migrationNote: preserved from previous standalone template example
---

# Approve Request Example

## Purpose

Markdown-preserved APEXlang example. Use this file for syntax and structure only after loading the family `_index.md` and `_common.md` contract.

## Example

```apexlang
/* create this component under shared-components/task-definitions/taskDefinitionName.apx
     - taskDefinitionName could be a valid suitable name   
     - Outcome-driven (Approve / Reject).
     - Used for authorization and governance.
     - All the substitutition strings should follow the format &LOAN_ACCOUNT_NO. , don't enclose it within #
     - Strictly use action component group to perform any post approval or completion action once the task has been completed.

   
   Common Use Cases
   ----------------
   - Order approval
   - Budget approval
   - Access approval

   Outcomes
   -------------------
   - APPROVE
   - REJECT

   Parameter rules
   -------------------
   - Do not use advanced.required; it is not a valid property for task parameters.

   Completion handling rules
   -------------------
   - Do not create page-level sendEmail processes for task completion.
   - Implement completion logic in the task definition action with execution.onEvent: complete.
   - If email is required, send it from this action using APEX_MAIL or sendEMail action under onEvent: complete .
  
   When determining participants for an Human Task:

   1. DO NOT hardcode usernames.
   2. DO NOT assume :APP_USER is the approver.
   3. ALWAYS resolve approvers from configured user tables.
   4. Find the appropriate approver/supervisor based on the user tables and roles.
   5. Fail safely if no approver is found.
   6. Validate the SQL or PL/SQL code blocks. 

Note: Prefer the structured `advanced { detailsPage: { ... } }` object form shown in this task-definition family. Do not default to a string `f?p=...` value when creating new task definitions. Keep the details page aligned with the task-details page family and pass the task id through the mapped page item.
*/
taskDefinition CHECKER_APPROVAL (
    name: Loan Approval
    type: approval
    task {
        subject: Loan Approval Required – &LOAN_ACCOUNT_NO.
    }
    advanced {
        detailsPage: {
            page: 20
            items: {
                P20_TASK_ID: &TASK_ID.
            }
            clearCache: 20
            action: resetPagination
        }
    }
    source {
        type: sqlQuery
        sqlQuery: select * from loan_master where loan_id = :APEX$TASK_PK
    }

    parameter DISBURSED_AMOUNT (
        label {
            label: Disbursed Amount
        }
        validation {
            required: false
        }
    )

    

    action loan-approved (
        name: Loan Approved
        type: executeCode
        source {
            plsqlCode: 
                ```plsql
                begin
                UPDATE loan_master
                SET status = :APEX$TASK_OUTCOME
                WHERE loan_id = :APEX$TASK_PK;
                
                
                INSERT INTO loan_checker_action (
                loan_id, checker_user, action)
                values(
                :APEX$TASK_PK,:APEX$TASK_OWNER,:APEX$TASK_OUTCOME);
                end;
                
                ```
        }
        execution {
            onEvent: complete
            outcome: approved
            sequence: 10
        }
        successMessage {
            successMessage: Loan Approved successfully.
        }
    )

    action loan-rejected (
        name: Loan Rejected
        type: executeCode
        source {
            plsqlCode: 
                ```plsql
                begin
                UPDATE loan_master
                SET status = :APEX$TASK_OUTCOME
                WHERE loan_id = :APEX$TASK_PK;
                
                
                INSERT INTO loan_checker_action (
                loan_id, checker_user, action)
                values(
                :APEX$TASK_PK,:APEX$TASK_OWNER,:APEX$TASK_OUTCOME);
                end;
                
                ```
        }
        execution {
            onEvent: complete
            outcome: rejected
            sequence: 20
        }
        successMessage {
            successMessage: Loan rejected successfully.
        }
    )
     action send-email (
        name: Send Email
        type: sendEMail
        comments {
            comments: Email header, template placeholder, and attachment attributes require compiler-backed sendEMail task-action syntax before emission.
        }
        execution {
            onEvent: complete
            sequence: 20
        }
    )

    participant (
        value {
            type: expression
            plsqlExpression: loan_workflow_api.get_checker(:APEX$TASK_PK)
        }
    )

)
```
