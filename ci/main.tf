provider "concourse" {
  url      = "https://ci.nehrke.info"
  team     = "main"
  username = var.concourse_username
  password = var.concourse_password
}

data "concourse_team" "this" {
  team_name = "main"
}

resource "concourse_pipeline" "this" {
  team_name              = data.concourse_team.this.team_name
  pipeline_name          = "comparator-js"
  is_exposed             = true
  is_paused              = false
  pipeline_config        = file("pipeline.yaml")
  pipeline_config_format = "yaml"
  vars = {
    repository_key = var.repository_key
    webhook_token  = var.webhoook_token
    npm_auth_token = var.npm_auth_token
  }
}
