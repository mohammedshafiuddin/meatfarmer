import React from "react";
import { Button as PaperButton, ButtonProps } from "react-native-paper";
// import { useTheme } from "../hooks/theme-context";
import { theme, useTheme } from "common-ui";
import { TouchableOpacity } from "react-native";
import MyText from "./text"; // Updated import path


// Omit 'children' from ButtonProps so it can't be passed
interface Props extends Omit<ButtonProps, "children"> {
  variant?: "blue" | "red" | "green";
  fillColor?: keyof ReturnType<typeof useTheme>["theme"]["colors"];
  textColor?: keyof ReturnType<typeof useTheme>["theme"]["colors"];
  borderColor?: keyof ReturnType<typeof useTheme>["theme"]["colors"];
  fullWidth?: boolean;
  textContent?: string;
  children?: React.ReactNode;
}

function MyButton({
  variant = "blue",
  fullWidth,
  fillColor,
  textColor,
  borderColor,
  children,
  textContent,
  ...props
}: Props) {
  const { colors } = useTheme().theme;
  let backgroundColor = colors.brand500;
  if (variant === "red") backgroundColor = colors.red1;
  if (variant === "green") backgroundColor = theme.colors.brand500
  if (fillColor && colors[fillColor]) backgroundColor = colors[fillColor];
  
  let finalTextColor = "#fff";
  if (textColor && colors[textColor]) finalTextColor = colors[textColor];
  
  let borderCol = backgroundColor;
  if (borderColor && colors[borderColor]) borderCol = colors[borderColor];

  const labelStyle = {
    color: finalTextColor,
    fontWeight: "400" as const,
    ...(props.labelStyle as object),
  };

  return (
    <PaperButton
      {...props}
      textColor={finalTextColor}
      style={[
        {
          backgroundColor,
          borderRadius: 8,
          alignSelf: "flex-start",
          borderWidth: 1,
          borderColor: borderCol,
          opacity: props.disabled ? 0.7 : 1,
          ...(fullWidth && { width: "100%" }),
        },
        props.style,
      ]}
      labelStyle={labelStyle}
    >
      {textContent ? <MyText style={{ color: finalTextColor }}>{textContent}</MyText> : children}
    </PaperButton>
  );
}

// MyTextButton props: same as Props, but no children and with an extra 'text' property
interface MyTextButtonProps extends Omit<Props, "children"> {
  text: string;
}

export function MyTextButton({
  variant = "blue",
  fillColor,
  textColor,
  text,
  ...props
}: MyTextButtonProps) {
  return (
    <MyButton
      variant={variant}
      fillColor={fillColor}
      textColor={textColor}
      {...props}
    >
      {text}
    </MyButton>
  );
}

export default MyButton;