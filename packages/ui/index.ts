import RolesDropdown from "./src/roles-dropdown";
import { StorageService } from "./src/services/StorageService";
import {
  ROLE_NAMES,
  ROLE_DISPLAY_NAMES,
  ROLE_OPTIONS,
  BUSINESS_ROLE_OPTIONS,
} from "./src/lib/constants";
import { colors, colorsType } from "./src/lib/theme-colors";
import { theme } from "./src/theme";
import MyButton, { MyTextButton } from "./src/components/button";
import { useTheme, Theme } from "./hooks/theme-context";
import MyTextInput from "./src/components/textinput";
import BottomDialog, { ConfirmationDialog } from "./src/components/dialog";
import DatePicker from "./src/components/date-picker";
import MyText from "./src/components/text";
import BottomDropdown from "./src/components/bottom-dropdown";
import ImageViewerURI from "./src/components/image-viewer";
import ImageCarousel from "./src/components/ImageCarousel";
import ImageGallery from "./src/components/ImageGallery";
import ImageGalleryWithDelete from "./src/components/ImageGalleryWithDelete";
import ImageUploader from "./src/components/ImageUploader";
import ProfileImage from "./src/components/profile-image";
import Checkbox from "./src/components/checkbox";
import AppContainer from "./src/components/app-container";
import tw from "./src/lib/tailwind";
import SearchBar from './src/components/search-bar'
import DataTable from './src/components/data-table';
import Quantifier from './src/components/quantifier';
import TabViewWrapper from './src/components/tab-view';
import useFocusCallback from './hooks/useFocusCallback'
import useManualRefresh from './hooks/useManualRefresh';

// const BASE_API_URL = 'http://10.0.2.2:4000';
const BASE_API_URL = 'https://technocracy.ovh/mf';
export {
  RolesDropdown,
  StorageService,
  ROLE_NAMES,
  ROLE_DISPLAY_NAMES,
  ROLE_OPTIONS,
  BUSINESS_ROLE_OPTIONS,
   colors,
   colorsType,
   theme,
   MyButton,
  MyTextButton,
  useTheme,
  Theme,
  MyTextInput,
  BottomDialog,
  MyText,
  ConfirmationDialog,
  DatePicker,

  BottomDropdown,
  ImageViewerURI,
   ImageCarousel,
   ImageGallery,
   ImageGalleryWithDelete,
    ImageUploader,
   ProfileImage,
   Checkbox,
  AppContainer,
  tw,
  SearchBar,
  DataTable,
  Quantifier,
  TabViewWrapper,
  useFocusCallback,
  useManualRefresh,
  BASE_API_URL
};
