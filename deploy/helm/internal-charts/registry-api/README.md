# registry-api

![Version: 0.0.58-terria.0](https://img.shields.io/badge/Version-0.0.58-terria.0-informational?style=flat-square)

A Helm chart for Kubernetes

## Requirements

Kubernetes: `>= 1.14.0-0`

## Values

| Key | Type | Default | Description |
|-----|------|---------|-------------|
| autoscaler.enabled | bool | `false` |  |
| autoscaler.maxReplicas | int | `3` |  |
| autoscaler.minReplicas | int | `1` |  |
| autoscaler.targetCPUUtilizationPercentage | int | `80` |  |
| db | object | `{}` |  |
| deployments.full | object | `{}` |  |
| deployments.readOnly.enable | bool | `false` |  |
| image | object | `{}` |  |
| livenessProbe | object | `{}` |  |
| resources.limits.cpu | string | `"750m"` |  |
| resources.requests.cpu | string | `"250m"` |  |
| resources.requests.memory | string | `"500Mi"` |  |
| validateJsonSchema | bool | `true` |  |