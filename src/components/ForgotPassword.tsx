import React from "react";

const ForgotPassword: React.FC = () => {
  const handleClick = () => {
    const subject = encodeURIComponent("Password Reset Request");
    const body = encodeURIComponent(
      "Hello Admin,\n\nI forgot my password. Please assist me in resetting it.\n\nThank you."
    );

    // Opens the user's mail client
    window.location.href = `mailto:madhavi.lakmini2000@gmail.com?subject=${subject}&body=${body}`;
  };

  return (
    <div className="form-container">
      <h2>Forgot Password</h2>
      <button onClick={handleClick}>Contact Admin</button>
    </div>
  );
};

export default ForgotPassword;
