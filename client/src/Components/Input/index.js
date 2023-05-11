import * as React from "react";
import styled from "@emotion/styled";
import Errors from "../Errors";
import Icon from "../Icon";

const InputComponent = ({
    className,
    containerStyle,
    errors,
    disabled,
    icon,
    inputStyle,
    name,
    onChange,
    placeholder,
    readOnly,
    required,
    type,
    value,
    wrapperStyle
  }) => {
    const inputRef = React.useRef(null);
  
    const handleClick = () => {
      if (inputRef && inputRef.current) inputRef.current.focus();
    };
  
    return (
      <div className={className} style={wrapperStyle}>
        <div onClick={handleClick} className="container" style={containerStyle}>
          {icon && <Icon dataTestId={`icon-${name}`} type={icon} />}
          <input
            ref={inputRef}
            aria-label={name}
            data-testid={name}
            tabIndex={0}
            type={type}
            name={name}
            onChange={onChange}
            placeholder={placeholder}
            value={value}
            style={inputStyle}
            disabled={disabled}
            readOnly={readOnly}
          />
        </div>
        {errors && !value && required && (
          <Errors data-testid="errors">Required!</Errors>
        )}
      </div>
    );
  };
  
  const Input = styled(InputComponent)`
    height: 65px;
    position: relative;
    width: 100%;
  
    .container {
      width: 100%;
  
      :not(:hover) {
        svg {
          color: ${({ errors, value, required }) =>
            errors && !value && required ? "#e80700" : "#ccc"};
        }
      }
    }
  
    input {
      color: #f7f7f7;
      padding: ${({ icon }) => `12px 0 12px ${icon ? 48 : 17}px`};
      width: 100%;
      font-size: 12px;
      border: 1px solid
        ${({ errors, value, required }) =>
          errors && !value && required ? "#e80700" : "#888"};
      border-radius: 10px;
      width: 100%;
      transition: border, color 0.2s ease-in-out;
      background: transparent;
  
      :-webkit-autofill {
        -webkit-text-fill-color: #fff;
        box-shadow: 0 0 0px 1000px #222b36 inset;
  
        :focus {
          box-shadow: 0 0 0px 1000px #266798 inset;
        }
      }
  
      ::placeholder {
        color: #ccc;
      }
  
      :hover {
        border: 1px solid #ccc;
      }
  
      :focus {
        outline: 0;
        border: 1px solid #ccc;
        background: #266798;
      }
    }
  `;
  
  export default Input;