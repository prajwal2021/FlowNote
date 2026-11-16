import { defineRailway, github, project, service } from "railway/iac";
// This repository manages only its own resources in the environment. Other
// repositories export their own partial name.
// See https://docs.railway.com/infrastructure-as-code#multi-repo-projects
export const partial = "flownote";
export default defineRailway(() => {
  const flownote = service("flownote", {
    source: github("prajwal2021/FlowNote", { branch: "main", checkSuites: false }),
    build: { buildEnvironment: "V3", builder: "DOCKERFILE", dockerfilePath: "apps/server/Dockerfile" },
    healthcheck: "/api/health",
    healthcheckTimeout: 120,
    replicas: { "iad": 1 },
  });

  return project("FlowNote", {
    variables: { managed: false },
    resources: [flownote],
  });
});
