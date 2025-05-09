import jwt from "jsonwebtoken";

const generateToken = (res, userId) => {
  console.log("🔐 Signing JWT with secret:", process.env.JWT_SECRET);

  const token = jwt.sign({ userId }, process.env.JWT_SECRET, {
    expiresIn: "30d",
  });

  return token;
};

export default generateToken;
