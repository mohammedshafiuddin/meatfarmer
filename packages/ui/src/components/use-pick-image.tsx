import React from "react";
import * as DocumentPicker from "expo-document-picker";
import * as ImagePicker from "expo-image-picker";

interface BaseProps {
  label?: string;
  multiple: boolean;
}

// interface Props {
//     setFile: (file: DocumentPicker.DocumentPickerAsset | null) => void;
//     label?: string;
// }
// type Props =
//   | { multiple: true; setFile: (value: DocumentPicker.DocumentPickerAsset[]) => void }
//   | { multiple?: false; setFile: (value: DocumentPicker.DocumentPickerAsset) => void };
type Props = {
  setFile: (file: any) => void;
  multiple: boolean;
};

interface ImageInfo {
  assetId?: string | null;
  base64?: string | null;
  duration?: number | null;
  exif?: Record<string, any> | null;
  fileName?: string | null;
  fileSize?: number;
  height?: number;
  mimeType?: string | null;
  name?: string | null;
  rotation?: number | null;
  type?: string;
  uri: string;
  width?: number;
}

function usePickImage({ setFile, multiple = false }: Props) {
  // const { setFile } = props;
  const handlePickFile = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ["images"],
        allowsMultipleSelection: multiple,
        quality: 1,
      });
      if (!result.canceled) {
        if (multiple) {
          setFile(
            result.assets.map((asset) => ({ ...asset, name: asset.fileName }))
          );
        } else {
          setFile({ ...result.assets[0], name: result.assets[0].fileName });
        }
      } else {
        setFile(null);
      }
    } catch (e) {
      setFile(null);
    }
  };
  return handlePickFile;
}

export default usePickImage;
