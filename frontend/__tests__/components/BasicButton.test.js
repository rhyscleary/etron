import { render } from "@testing-library/react-native";
import BasicButton from "../../components/common/buttons/Button";

describe('BasicButton', () => {
    it("renders with the correct label", () => {
        const { getByText } = render(<BasicButton label="Test Label" onPress={() => {}} />);
        expect(getByText("Test Label")).toBeTruthy();
    })
});