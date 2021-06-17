# Scaffoldly Config Files

*NOTE: DO NOT MANUALLY EDIT THESE FILES*

These are managed by the `scaffoldly-bootstrap` project in your oganization.

They are by adjusting the configuration in that project.

For more info: https://docs.scaffold.ly/infrastructure/configuration-files

## Stages

```yaml
- "live"
- "nonlive"

```

## Services

```yaml
"auth":
  "live":
    "base_url": "https://sly.futz.dev/auth"
    "repo_name": "sly-auth-api"
    "service_name": "auth"
  "nonlive":
    "base_url": "https://sly-dev.futz.dev/auth"
    "repo_name": "sly-auth-api"
    "service_name": "auth"
"example":
  "live":
    "base_url": "https://sly.futz.dev/example"
    "repo_name": "example-sls-rest-api"
    "service_name": "example"
  "nonlive":
    "base_url": "https://sly-dev.futz.dev/example"
    "repo_name": "example-sls-rest-api"
    "service_name": "example"

```

## Stage Env Vars (Higher precedence than Shared Env Vars)

```yaml
"live":
  "MAIL_DOMAIN": "slyses.futz.dev"
  "SERVERLESS_API_DOMAIN": "sly.futz.dev"
"nonlive":
  "MAIL_DOMAIN": "slyses-dev.futz.dev"
  "SERVERLESS_API_DOMAIN": "sly-dev.futz.dev"

```

## Shared Env Vars

```yaml
{}

```

## Full `stage_domains` Config

_NOTE:_ This map isn't *directly* written to any configuration files and is 
meant to be informative for service owners visibility of what's availalbe
on the platform.

```yaml
"live":
  "certificate_arn": "arn:aws:acm:us-east-1:461540291868:certificate/9f458373-3a5c-4b8e-8925-91c4d5f281ab"
  "dns_domain_id": "Z03521589BBLNVKGERI1"
  "dns_provider": "aws"
  "domain": "futz.dev"
  "platform_domains":
    "mail_domain": "slyses.futz.dev"
    "serverless_api_domain": "sly.futz.dev"
  "serverless_api_domain": "sly.futz.dev"
  "stage_env_vars":
    "MAIL_DOMAIN": "slyses.futz.dev"
    "SERVERLESS_API_DOMAIN": "sly.futz.dev"
  "subdomain": "sly"
  "subdomain_suffix": ""
"nonlive":
  "certificate_arn": "arn:aws:acm:us-east-1:461540291868:certificate/779615a5-c38b-4df4-b77e-64db8dfb85f3"
  "dns_domain_id": "Z03521589BBLNVKGERI1"
  "dns_provider": "aws"
  "domain": "futz.dev"
  "platform_domains":
    "mail_domain": "slyses-dev.futz.dev"
    "serverless_api_domain": "sly-dev.futz.dev"
  "serverless_api_domain": "sly-dev.futz.dev"
  "stage_env_vars":
    "MAIL_DOMAIN": "slyses-dev.futz.dev"
    "SERVERLESS_API_DOMAIN": "sly-dev.futz.dev"
  "subdomain": "sly"
  "subdomain_suffix": "dev"

```

If any of this configuration needs to be exported, an issue can be raised on the
[Scaffoldly Terraform Bootstrap](https://github.com/scaffoldly/terraform-scaffoldly-bootstrap)
project.

