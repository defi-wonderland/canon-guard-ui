import { CssBaseline, styled } from "@mui/material";
import { Outlet } from "react-router-dom";

export const AppLayout = () => {
  return (
    <>
      <CssBaseline />
      <MainContent>
        <NoScriptMessage>
          <p>This website requires JavaScript to function properly.</p>
        </NoScriptMessage>
        <Outlet />
      </MainContent>
    </>
  );
};

const MainContent = styled("div")`
  display: flex;
  flex-direction: column;
  width: 100%;
  height: 100vh;
  overflow: hidden;
  margin: 0;
  padding: 0;
`;

const NoScriptMessage = styled("noscript")(() => {
  return {
    margin: "0 auto",
    width: "100%",
    textAlign: "center",
    fontSize: "1.6rem",
    padding: "1rem 0",
    p: {
      padding: "1rem 0",
      margin: 0,
    },
  };
});
