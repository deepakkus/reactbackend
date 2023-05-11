import styled from "@emotion/styled";

const StyledButton = ({
  className,
  children,
  dataTestId,
  disabled,
  onClick,
  style,
  type
}) => (
  <button
    data-testid={dataTestId}
    disabled={disabled}
    type={type}
    className={className}
    onClick={onClick}
    style={style}
  >
    {children}
  </button>
);

const Button = styled(StyledButton)`
  cursor: ${({ disabled }) => (!disabled ? "pointer" : "not-allowed")};
  display: ${({ display }) => display || "block"};
  background-color: #1e87f0;
  color: #fff;
  border: 1px solid transparent;
  text-decoration: none;
  transition: all 0.2s ease-in-out;
  border-radius: 10px;
  width: ${({ width }) => width || "100%"};
  padding: ${({ padding }) => padding || "10px"};
  font-size: ${({ fontSize }) => fontSize || "12px"};
  margin: ${({ margin }) => margin || "auto"};
  max-width: ${({ maxWidth }) => maxWidth || "auto"};
  letter-spacing: 1px;

  :hover {
    background-color: #0f7ae5;
    color: #fff;
  }

  :focus {
    outline: 0;
  }
`;

export default Button;
