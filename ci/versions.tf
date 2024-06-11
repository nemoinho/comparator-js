terraform {
  backend "local" {
  }

  required_providers {
    concourse = {
      source  = "terraform-provider-concourse/concourse"
      version = "8.0.1"
    }
  }

  required_version = "~> 1.8.5"
}
