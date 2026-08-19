jest.mock("@react-native-async-storage/async-storage", () =>
  require("@react-native-async-storage/async-storage/jest/async-storage-mock"),
);

jest.mock("@expo/vector-icons", () => {
  const React = require("react");
  const { Text } = require("react-native");
  return {
    Ionicons: (props) => React.createElement(Text, props, props.name),
  };
});

jest.mock("expo-image", () => ({
  Image: jest.requireActual("react-native").Image,
}));