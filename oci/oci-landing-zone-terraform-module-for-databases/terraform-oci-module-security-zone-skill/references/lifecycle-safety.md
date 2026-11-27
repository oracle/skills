# Security Zones lifecycle safety

Read this reference for every update, removal, deletion, or map-key change.

- Treat removing a recipe or Security Zone from module configuration as a Terraform destroy, not source cleanup.
- Require the exact module map key, Terraform state address, and intended action before proposing a mutation. Renaming a key is normally destroy/create; do not do it unless the user explicitly requests it and accepts the plan effect.
- Before creating, moving, or changing a Security Zone's compartment association, warn that it applies to the compartment and subcompartments and replaces an existing Cloud Guard target in that compartment.
- Before deleting a Security Zone, warn that the compartment will no longer have that zone's preventative policies. Do not say that Cloud Guard will be disabled; this module does not disable it.
- Before deleting or changing a recipe, identify all Security Zones that reference its key. Do not remove a referenced recipe without an explicit ordered migration or deletion request.
- Never run Terraform, OCI writes, imports, state commands, or Cloud Guard enable/disable operations.

For any lifecycle change, state the exact object(s), expected update/replacement/destroy effect, compartment scope, possible target replacement, and requirement to review `terraform plan` before apply.
