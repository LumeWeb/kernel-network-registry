import { ActiveQuery, addHandler } from "@lumeweb/libkernel/module";
import { EventEmitter } from "events";

const types: Set<string> = new Set<string>();
const networks: Map<string, Set<string>> = new Map<string, Set<string>>();

const events = new EventEmitter();

addHandler("registerType", handleRegisterType);
addHandler("getTypes", handleGetTypes);
addHandler("getNetworkTypes", handleGetNetworkTypes);
addHandler("getNetworksByType", handleGetNetworksByType);
addHandler("registerNetwork", handleRegisterNetwork);
addHandler("subscribeToUpdates", handleSubscribeToUpdates, {
  receiveUpdates: true,
});

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

  events.emit("update");

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

function handleSubscribeToUpdates(aq: ActiveQuery) {
  const cb = () => {
    aq.sendUpdate();
  };

  events.on("update", cb);

  aq.setReceiveUpdate?.(() => {
    events.off("update", cb);
    aq.respond();
  });
}
