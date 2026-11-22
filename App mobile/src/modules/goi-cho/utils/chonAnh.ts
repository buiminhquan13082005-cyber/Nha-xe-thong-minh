import * as ImagePicker from 'expo-image-picker';
import { ImageManipulator, SaveFormat } from 'expo-image-manipulator';
import { ANH_RONG_TOI_DA, CHAT_LUONG_JPEG, type AnhDaChon } from './anhGiayDangKy';

export type NguonAnh = 'camera' | 'thu-vien';

/** Kết quả chọn ảnh: ảnh đã nén, người dùng bấm huỷ, hoặc lỗi (thiếu quyền...) kèm câu tiếng Việt. */
export type KetQuaChonAnh = { anh: AnhDaChon } | { huy: true } | { loi: string };

/** Kích thước tệp ảnh đã nén (byte), để kiểm tra 5 MB trước khi gửi; không đọc được thì bỏ qua (server vẫn kiểm tra). */
async function kichThuocTep(uri: string): Promise<number | undefined> {
  try { return (await (await fetch(uri)).blob()).size; } catch { return undefined; }
}

/**
 * Chụp hoặc chọn ảnh giấy đăng ký xe, rồi thu về tối đa 1600px chiều ngang, lưu JPEG chất lượng 0.8
 * (ảnh 4000px của điện thoại vài MB → vài trăm KB, gửi nhanh hơn và không vượt giới hạn 5 MB của server).
 */
export async function chonAnhGiayDangKy(nguon: NguonAnh): Promise<KetQuaChonAnh> {
  try {
    const quyen = nguon === 'camera'
      ? await ImagePicker.requestCameraPermissionsAsync()
      : await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!quyen.granted) {
      return { loi: nguon === 'camera'
        ? 'App chưa được phép dùng máy ảnh. Mở Cài đặt của điện thoại để cấp quyền, hoặc chọn ảnh từ thư viện.'
        : 'App chưa được phép xem ảnh. Mở Cài đặt của điện thoại để cấp quyền, hoặc chụp ảnh mới.' };
    }
    const tuyChon: ImagePicker.ImagePickerOptions = { mediaTypes: ['images'], quality: 1, allowsEditing: false };
    const kq = nguon === 'camera' ? await ImagePicker.launchCameraAsync(tuyChon) : await ImagePicker.launchImageLibraryAsync(tuyChon);
    if (kq.canceled || !kq.assets?.[0]) return { huy: true };

    const goc = kq.assets[0];
    const anh = await ImageManipulator.manipulate(goc.uri, { maxWidth: ANH_RONG_TOI_DA }).renderAsync();
    const luu = await anh.saveAsync({ format: SaveFormat.JPEG, compress: CHAT_LUONG_JPEG });
    return { anh: { uri: luu.uri, ten: `giay-dang-ky-${Date.now()}.jpg`, kieu: 'image/jpeg', kichThuoc: await kichThuocTep(luu.uri) } };
  } catch {
    return { loi: 'Không lấy được ảnh. Thử chụp lại hoặc chọn ảnh khác.' };
  }
}
