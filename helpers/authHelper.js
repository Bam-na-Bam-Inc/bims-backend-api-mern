import { genSalt, hash as _hash, compare } from "bcrypt";

// hash function
export function hashPassword(password) {
  return new Promise((resolve, reject) => {
    genSalt(10, (err, salt) => {
      if (err) {
        reject(err);
      }
      _hash(password, salt, (err, hash) => {
        if (err) {
          reject(err);
        }
        resolve(hash);
      });
    });
  });
}

// compare and decrypt function
export function comparePassword(password, hashed) {
  return compare(password, hashed);
}
