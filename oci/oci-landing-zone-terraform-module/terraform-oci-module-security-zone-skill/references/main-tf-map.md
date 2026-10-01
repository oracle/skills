# Security Zones Terraform file map

Use after support and validation succeed.

## Module block

```hcl
module "security_zones" {
  source = "git::https://github.com/oci-landing-zones/terraform-oci-modules-security.git//security-zones?ref=<approved-ref>"

  tenancy_ocid                 = var.tenancy_ocid
  security_zones_configuration = var.security_zones_configuration
  compartments_dependency      = var.compartments_dependency
}
```

Include `compartments_dependency` only when selected. Add `enable_output` or `module_name` only when the user supplies them. Do not add a second module block when one already exists.

## Object shape

```hcl
security_zones_configuration = {
  recipes = {
    RECIPE_KEY = {
      name           = "example-recipe"
      compartment_id = "ocid1.compartment..."
      cis_level      = "1"
    }
  }

  security_zones = {
    ZONE_KEY = {
      name           = "example-zone"
      compartment_id = "ocid1.compartment..."
      recipe_key     = "RECIPE_KEY"
    }
  }
}
```

This is a shape-only example. Replace neither existing user data nor placeholders with guessed values.

## File placement

- `main.tf`: Terraform/provider blocks and module wiring.
- `variables.tf`: typed `tenancy_ocid`, `security_zones_configuration`, and selected optional module inputs.
- `terraform.tfvars`: validated non-secret OCIDs, logical keys, names, CIS level, tags, and region values.

In an existing repository, retain its established file placement and formatting instead of forcing this layout.
