---
templateId: shared-components.task-definitions.action-task.example
componentType: markdown-apexlang-example
version: 1.0
migrationNote: preserved from previous standalone template example
---

# Action Task Example

## Purpose

Markdown-preserved APEXlang example. Use this file for syntax and structure only after loading the family `_index.md` and `_common.md` contract.

## Example

```apexlang
/* create this component under shared-components/task-definitions/taskDefinitionName.apx
   - taskDefinitionName could be a valid suitable name   
   - Completion-driven (task done).
   - Used for manual operational steps.
   - Outcome may simply be "Completed".
   - All the substitutition strings should follow the format &LOAN_ACCOUNT_NO. , don't enclose it within #
   - Strictly use action component group to perform any post approval or completion action once the task has been completed.
   Common Use Cases
   ----------------
   - Verify documents
   - Upload missing files
   - Perform physical inspection
   - Enter additional data

   Outcomes (Optional)
   ------------------
   - COMPLETED

   Parameter rules
   ------------------
   - Do not use advanced.required; it is not a valid property for task parameters.

   Completion handling rules
   ------------------
   - Do not create page-level sendEmail processes for task completion.
   - Implement completion logic in the task definition action with execution.onEvent: complete.
   - If email is required, send it from this action using APEX_MAIL or sendEMail under action onEvent: complete.
   - When using APEX_MAIL.SEND with p_template_static_id, the value MUST match the email template Static ID exactly (case-sensitive, includes hyphens). Do not guess or transform names.
   - Preferred: use native sendEMail action with emailTemplate: @<static-id> to avoid mismatches.
   - Do not call undocumented APEX/DB APIs. Verify package/procedure existence in the target schema
     (ALL_OBJECTS/ALL_PROCEDURES) before use; prefer native actions when available.
   
   When determining participants for an Human Task:

   1. DO NOT hardcode usernames.
   2. DO NOT assume :APP_USER is the approver.
   3. ALWAYS resolve approvers from configured user tables.
   4. Find the appropriate approver/supervisor based on the user tables and roles.
   5. Fail safely if no approver is found.
   6. Validate the SQL or PL/SQL code blocks. 

Note: Prefer the structured `advanced { detailsPage: { ... } }` object form shown in this task-definition family. Do not default to a string `f?p=...` value when creating new task definitions. Keep the details page aligned with the task-details page family and pass the task id through the mapped page item.

*/

taskDefinition LOAN_ACTION (
    name: Loan Action
    type: action
    task {
        subject: Loan Action Required – &LOAN_ACCOUNT_NO.
    }
    advanced {
        detailsPage: {
            page: 10
            items: {
                P10_TASK_ID: &TASK_ID.
            }
            clearCache: 10
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
        advanced {
            updatable: true
        }
    )


    action loan-action-completed (
        name: Loan action - completed
        type: executeCode
        source {
            plsqlCode: 
                ```plsql
                begin
                    update LOAN_MASTER set DISBURSED_AMOUNT = :DISBURSED_AMOUNT ,DISBURSED_DATE = trunc(sysdate) where loan_id = :LOAN_ID;
                    -- add plsql logic here
                end;
                ```
        }
        execution {
            onEvent: complete
            sequence: 10
        }
        successMessage {
            successMessage: Disbursed amount has been updated successfully.
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
            plsqlExpression: loan_workflow_api.get_action_owner(:APEX$TASK_PK)
        }
    )

)
```
