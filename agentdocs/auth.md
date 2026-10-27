# auth.md

## Overview
Authentication and registration guide for agents using Chattydesk.

## Discovery
- OAuth Protected Resource Metadata: https://chatty.nevatal.id/.well-known/oauth-protected-resource
- OAuth 2.0 Authorization Server Metadata: https://chatty.nevatal.id/.well-known/oauth-authorization-server
- OpenID Connect Discovery: https://chatty.nevatal.id/.well-known/openid-configuration
- API Catalog: https://chatty.nevatal.id/.well-known/api-catalog
- Agent Card: https://chatty.nevatal.id/.well-known/agent-card.json

## Registration
Public content can be read without credentials. Agents that need write
access register at https://chatty.nevatal.id/api/agent/register and receive bearer credentials.
