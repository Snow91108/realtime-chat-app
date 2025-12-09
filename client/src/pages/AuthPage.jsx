import { useState } from "react";
import Login from "./Login";
import Register from "./Register";

const AuthPage = () => {
  const [isLogin, setIsLogin] = useState(true);

  return isLogin ? (
    <Login onSwitch={() => setIsLogin(false)} />
  ) : (
    <Register onSwitch={() => setIsLogin(true)} />
  );
};

export default AuthPage;
