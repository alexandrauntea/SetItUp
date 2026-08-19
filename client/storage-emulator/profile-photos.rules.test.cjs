const fs = require("node:fs");
const path = require("node:path");
const {
  assertFails,
  assertSucceeds,
  initializeTestEnvironment,
} = require("@firebase/rules-unit-testing");

const PROJECT_ID = "demo-setitup";
const ALICE_UID = "alice-user";
const BOB_UID = "bob-user";
const VALID_JPEG = new Uint8Array([0xff, 0xd8, 0xff, 0xd9]);
const FIVE_MEGABYTES = 5 * 1024 * 1024;

let testEnvironment;

const photoReference = (context, userId, fileName = "profile-photo.jpg") =>
  context.storage().ref(`profilePhotos/${userId}/${fileName}`);

const uploadJpeg = (reference, bytes = VALID_JPEG) =>
  reference.put(bytes, { contentType: "image/jpeg" });

beforeAll(async () => {
  testEnvironment = await initializeTestEnvironment({
    projectId: PROJECT_ID,
    storage: {
      rules: fs.readFileSync(
        path.resolve(__dirname, "../../database/storage.rules"),
        "utf8",
      ),
    },
  });
});

beforeEach(async () => {
  await testEnvironment.clearStorage();
});

afterAll(async () => {
  await testEnvironment.cleanup();
});

describe("regulile Firebase Storage pentru fotografiile de profil", () => {
  test("proprietarul autentificat poate incarca, citi si sterge o fotografie valida", async () => {
    const alice = testEnvironment.authenticatedContext(ALICE_UID);
    const reference = photoReference(alice, ALICE_UID);

    await assertSucceeds(uploadJpeg(reference));
    await assertSucceeds(reference.getMetadata());
    await assertSucceeds(reference.delete());
  });

  test("un utilizator neautentificat nu poate citi sau incarca fotografii", async () => {
    const anonymous = testEnvironment.unauthenticatedContext();
    const reference = photoReference(anonymous, ALICE_UID);

    await assertFails(uploadJpeg(reference));
    await assertFails(reference.getMetadata());
  });

  test("un utilizator autentificat poate citi fotografia altui profil", async () => {
    const alice = testEnvironment.authenticatedContext(ALICE_UID);
    const bob = testEnvironment.authenticatedContext(BOB_UID);

    await assertSucceeds(uploadJpeg(photoReference(alice, ALICE_UID)));
    await assertSucceeds(photoReference(bob, ALICE_UID).getMetadata());
  });

  test("un utilizator nu poate inlocui sau sterge fotografia altui profil", async () => {
    const alice = testEnvironment.authenticatedContext(ALICE_UID);
    const bob = testEnvironment.authenticatedContext(BOB_UID);
    const alicePhoto = photoReference(alice, ALICE_UID);
    const alicePhotoAsBob = photoReference(bob, ALICE_UID);

    await assertSucceeds(uploadJpeg(alicePhoto));
    await assertFails(uploadJpeg(alicePhotoAsBob));
    await assertFails(alicePhotoAsBob.delete());
  });

  test("respinge fisierele care depasesc 5 MB", async () => {
    const alice = testEnvironment.authenticatedContext(ALICE_UID);
    const oversizedPhoto = new Uint8Array(FIVE_MEGABYTES + 1);

    await assertFails(
      uploadJpeg(photoReference(alice, ALICE_UID, "oversized.jpg"), oversizedPhoto),
    );
  });

  test("respinge fisierele care nu sunt imagini acceptate", async () => {
    const alice = testEnvironment.authenticatedContext(ALICE_UID);
    const reference = photoReference(alice, ALICE_UID, "document.jpg");

    await assertFails(reference.put(VALID_JPEG, { contentType: "text/plain" }));
  });

  test("respinge extensiile si numele de fisier nepermise", async () => {
    const alice = testEnvironment.authenticatedContext(ALICE_UID);

    await assertFails(
      photoReference(alice, ALICE_UID, "profile.gif").put(VALID_JPEG, {
        contentType: "image/gif",
      }),
    );
    await assertFails(
      uploadJpeg(photoReference(alice, ALICE_UID, "profile photo.jpg")),
    );
  });
});
