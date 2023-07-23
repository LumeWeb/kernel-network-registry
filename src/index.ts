import { ActiveQuery, addHandler } from "@lumeweb/libkernel/module";

const types: Set<string> = new Set<string>();
const networks: Map<string, Set<string>> = new Map<string, Set<string>>();

addHandler("registerType", handleRegisterType);
addHandler("getTypes", handleGetTypes);
addHandler("getNetworkTypes", handleGetNetworkTypes);
addHandler("getNetworksByType", handleGetNetworksByType);
addHandler("registerNetwork", handleRegisterNetwork);

function handleRegisterType(aq: ActiveQuery) {
  types.add(aq.callerInput);

  aq.respond();
}

function handleGetTypes(aq: ActiveQuery) {
  aq.respond([...types.values()]);
}

function handleRegisterNetwork(aq: ActiveQuery) {
  if (!("types" in aq.callerInput)) {
    aq.reject("types missing");
    return;
  }

  if (!Array.isArray(aq.callerInput.types)) {
    aq.reject("types must be an array");
    return;
  }

  let network = networks.get(aq.domain);

  if (network) {
    [...aq.callerInput.type].forEach((item) => network?.add(item));
  } else {
    networks.set(aq.domain, new Set([...aq.callerInput.types]));
  }

  aq.respond();
}

function handleGetNetworkTypes(aq: ActiveQuery) {
  if (!("module" in aq.callerInput)) {
    aq.reject("module missing");
    return;
  }

  if (!networks.has(aq.callerInput.module)) {
    aq.reject("module is not registered");
    return;
  }

  aq.respond([
    ...(networks.get(aq.callerInput.module) as Set<string>).values(),
  ]);
}

function handleGetNetworksByType(aq: ActiveQuery) {
  if (!("type" in aq.callerInput)) {
    aq.reject("type missing");
    return;
  }

  if (!types.has(aq.callerInput.type)) {
    aq.reject("type not registered");
    return;
  }

  aq.respond(
    [...networks.entries()]
      .filter((item) => {
        return item[1].has(aq.callerInput.type);
      })
      .map((item) => item[0]),
  );
}
