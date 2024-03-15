import { ActionPanel, Form, Action, Clipboard, showToast } from "@raycast/api";
import { useEffect, useState } from "react";
import { getFinderSelectedImages } from "./util";
import fs from "fs/promises";
import path from "path";
import crypto from "crypto";
import axios from "axios";
import FormData from "form-data";

const uploadFile = (fileBuffer: Buffer, fileName: string, ext: string, filePath?: string) => {
  const formData = new FormData();
  formData.append("content", fileBuffer, fileName);
  formData.append("file_name", fileName);
  if (filePath) {
    formData.append("file_path", filePath);
  }
  formData.append("file_type", `image/${ext}`);

  return axios
    .post("https://ucm.laiye.com/api/dialogue/upload/file", formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    })
    .then((res) => {
      const { data, error } = res.data;

      if (error?.error_code !== 0) {
        return Promise.reject(error.error_detail);
      } else {
        return Promise.resolve(data?.url);
      }
    })
    .catch(Promise.reject);
};
export default function Command() {
  const [loading, setLoading] = useState(false);
  useEffect(() => {
    const loadMedia = async () => {
      const finder = await getFinderSelectedImages();
      console.log("finder", finder);
    };
    loadMedia();
  }, []);

  const submit = async (values: { file: string[]; file_name: string; file_path: string }) => {
    const { file, file_name, file_path } = values;
    const file_url = file[0];
    setLoading(true);
    const data = await fs.readFile(file_url);

    let name = file_name;
    const type = path.extname(file_url).slice(1);
    if (!file_name) {
      const hash = crypto.createHash("sha256").update(data).digest("hex").substring(0, 15);
      name = `${hash}.${type}`;
    }
    if (!name.includes(type)) {
      name += `.${type}`;
    }

    uploadFile(data, name, type, file_path)
      .then(async (res) => {
        await Clipboard.copy(res);
        showToast({ title: "upload success", message: `url copied to clipboard` });
      })
      .finally(() => {
        setLoading(false);
      });
  };
  return (
    <Form
      isLoading={loading}
      actions={
        <ActionPanel>
          <Action.SubmitForm title="立即上传" onSubmit={submit} />
        </ActionPanel>
      }
    >
      <Form.FilePicker id="file" title="choose file" allowMultipleSelection={false} />
      <Form.TextField id="file_name" title="file name" />
      <Form.TextField id="file_path" title="sub file path" defaultValue="assets/" placeholder="Should end with ‘/’" />
    </Form>
  );
}
