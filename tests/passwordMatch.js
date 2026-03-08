import { comparePassword, hashPassword } from "../helpers/authHelper.js";

const hashedPassword =
  "$2b$10$BfQ005jZd01b7naTxMO.L.nRDKgd2OMY43Flrl3B8s3gti3z3fSXC"; // Your bcrypt hash
const passwordToCheck = "EZP-TDVYShPZ";

const passwordKo = "ezpay-admin2024";

const passwordnew = "ezpay-admin2025";

(async () => {
  try {
    // const match = await comparePassword(passwordToCheck, hashedPassword);

    // Debugging Step 2: Hash the new password
    const hashedNewPassword = await hashPassword(passwordnew);
    console.log("New hashed password:", hashedNewPassword); // This should log the hashed version of the password.

    // if (match) {
    //   console.log("password match");
    // } else {
    //   console.log("password did not match");
    // }
  } catch (error) {
    console.error("Error comparing passwords:", error);
  }
})();
