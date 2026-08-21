const { assertFails, assertSucceeds, initializeTestEnvironment } = require("@firebase/rules-unit-testing");
const fs = require("fs");
const path = require("path");

describe("Firestore Security Rules - Match Chat (Sprint 4)", () => {
  let testEnv;

  beforeAll(async () => {
    testEnv = await initializeTestEnvironment({
      projectId: "setitup-messaging-test",
      firestore: {
        rules: fs.readFileSync(
          path.join(__dirname, "../../database/firestore.rules"),
          "utf8",
        ),
      },
    });
  });

  afterAll(async () => {
    await testEnv.cleanup();
  });

  beforeEach(async () => {
    await testEnv.clearFirestore();
  });

  test("Utilizatorii neautorizați NU pot citi sau scrie mesaje", async () => {
    const unauthedDb = testEnv.unauthenticatedContext().firestore();
    await assertFails(unauthedDb.collection("conversations").doc("match1").get());
  });

  test("Managerul autorizat POATE citi conversația", async () => {
    const managerId = "managerA";
    await testEnv.withSecurityRulesDisabled(async (context) => {
      await context.firestore().collection("conversations").doc("match1").set({
        managerIds: ["managerA", "managerB"],
        blockedBy: null
      });
    });

    const authedDb = testEnv.authenticatedContext(managerId).firestore();
    await assertSucceeds(authedDb.collection("conversations").doc("match1").get());
  });

  test("Managerul autorizat POATE lista propriile conversații", async () => {
    const managerId = "managerA";
    await testEnv.withSecurityRulesDisabled(async (context) => {
      await context.firestore().collection("conversations").doc("match1").set({
        managerIds: ["managerA", "managerB"],
        blockedBy: null,
      });
    });

    const authedDb = testEnv.authenticatedContext(managerId).firestore();
    await assertSucceeds(
      authedDb
        .collection("conversations")
        .where("managerIds", "array-contains", managerId)
        .get(),
    );
  });

  test("Managerul POATE crea mesaje dacă nu există un blocaj", async () => {
    const managerId = "managerA";
    await testEnv.withSecurityRulesDisabled(async (context) => {
      await context.firestore().collection("conversations").doc("match1").set({
        managerIds: ["managerA", "managerB"],
        blockedBy: null
      });
    });

    const authedDb = testEnv.authenticatedContext(managerId).firestore();
    const messageRef = authedDb.collection("conversations").doc("match1").collection("messages").doc("msg1");
    
    await assertSucceeds(messageRef.set({
      senderId: managerId,
      senderRole: "manager",
      text: "Salut! Am un match pentru tine."
    }));
  });

  test("Managerul NU POATE trimite mesaje dacă conversația este blocată", async () => {
    const managerId = "managerB";
    await testEnv.withSecurityRulesDisabled(async (context) => {
      await context.firestore().collection("conversations").doc("match1").set({
        managerIds: ["managerA", "managerB"],
        blockedBy: "managerA" // managerA a blocat conversația
      });
    });

    const authedDb = testEnv.authenticatedContext(managerId).firestore();
    const messageRef = authedDb.collection("conversations").doc("match1").collection("messages").doc("msg2");
    
    await assertFails(messageRef.set({
      senderId: managerId,
      senderRole: "manager",
      text: "Acest mesaj nu trebuie să treacă."
    }));
  });

  test("Doar blockerId-ul POATE șterge documentul de block (Unblock)", async () => {
    const blockerId = "managerA";
    await testEnv.withSecurityRulesDisabled(async (context) => {
      await context.firestore().collection("blocks").doc("managerA_managerB").set({
        blockerId: "managerA",
        blockedId: "managerB"
      });
    });

    const blockedUserDb = testEnv.authenticatedContext("managerB").firestore();
    // Persoana blocată nu își poate scoate singură block-ul
    await assertFails(blockedUserDb.collection("blocks").doc("managerA_managerB").delete());

    const blockerDb = testEnv.authenticatedContext(blockerId).firestore();
    // Cel care a dat block îl poate scoate
    await assertSucceeds(blockerDb.collection("blocks").doc("managerA_managerB").delete());
  });
});
