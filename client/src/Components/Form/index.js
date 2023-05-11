import styled from "@emotion/styled";

const Form = styled.form`
  margin: ${({ margin }) => margin || "0 auto"};
  max-width: ${({ maxWidth }) => maxWidth || "400px"};
  background: ${({ background }) => background || "transparent"};
  padding: ${({ padding }) => padding || "30px"};
  border-radius: ${({ borderRadius }) => borderRadius || "0"};
`;

export default Form;
