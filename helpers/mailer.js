import nodemailer from "nodemailer";
import dotenv from "dotenv";

// .env config
dotenv.config();

export const sendMail = async (email, resetPassword) => {
  try {
    const transporter = nodemailer.createTransport({
      service: "gmail",
      host: "smtp.gmail.com",
      port: 587,
      secure: false,
      auth: {
        user: process.env.USER,
        pass: process.env.APP_PASSWORD,
      },
    });

    const mailOptions = {
      from: {
        name: "EZ Pay App",
        address: process.env.USER,
      },
      to: email, // receiver
      subject: "Password Reset ✔", // Subject line
      text: `Hello! This is your reset password: \n${resetPassword}\n\n You can now login using this OTP. After logging in, change and update your password through your Account Setting. Have a nice day!`, // plain text body
      html: `Hello! This is your reset password: <b>${resetPassword}</b>. You can now login using this OTP. After logging in, change and update your password through your Account Setting. Have a nice day!`, // HTML body with bold password
    };

    const info = transporter.sendMail(mailOptions);
    console.log("Email has been sent!" + info.response);
  } catch (error) {
    console.error("Error sending email: ", error);
  }
};
