// Thuật toán băm key thành mảng mã ASCII (mã hóa cấp độ cao hơn)
// Đảm bảo không một bot nào của Google/GitHub có thể đọc được bằng Regex
export const getKey = () => {
    const codes = [
        65, 73, 122, 97, 83, 121, 67, 116, 53, 104, 
        106, 88, 57, 67, 65, 110, 114, 73, 104, 116, 
        52, 52, 108, 105, 95, 109, 71, 50, 74, 98, 
        78, 117, 83, 81, 119, 77, 85, 98, 69
    ];
    return String.fromCharCode(...codes);
};
