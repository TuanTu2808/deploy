-- phpMyAdmin SQL Dump
-- version 5.2.1
-- https://www.phpmyadmin.net/
--
-- Máy chủ: localhost:3306
-- Thời gian đã tạo: Th4 09, 2026 lúc 06:08 PM
-- Phiên bản máy phục vụ: 8.0.39
-- Phiên bản PHP: 8.1.10

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Cơ sở dữ liệu: `25zone`
--

-- --------------------------------------------------------

--
-- Cấu trúc bảng cho bảng `address_ship`
--

CREATE TABLE `address_ship` (
  `Id_address_ship` int NOT NULL,
  `Receiver_name` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NOT NULL,
  `Phone` varchar(13) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NOT NULL,
  `Province` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NOT NULL,
  `Ward` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NOT NULL,
  `Address_detail` text CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NOT NULL,
  `Id_user` int NOT NULL,
  `Is_default` tinyint(1) NOT NULL DEFAULT '0'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Đang đổ dữ liệu cho bảng `address_ship`
--

INSERT INTO `address_ship` (`Id_address_ship`, `Receiver_name`, `Phone`, `Province`, `Ward`, `Address_detail`, `Id_user`, `Is_default`) VALUES
(1, 'Nguyễn Du', '0397311449', 'Tỉnh Bình Phước', 'Phường Long Phước', '123 Bình Long', 2, 1),
(2, 'Huỳnh Ngọc Tiến', '0902275501', 'Thành phố Hồ Chí Minh', 'Phường 6', '2/90/22 thiên phước', 20, 1);

-- --------------------------------------------------------

--
-- Cấu trúc bảng cho bảng `bookings`
--

CREATE TABLE `bookings` (
  `Id_booking` int NOT NULL,
  `Booking_date` date NOT NULL,
  `Start_time` datetime NOT NULL,
  `End_time` datetime DEFAULT NULL,
  `Phone` varchar(13) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NOT NULL,
  `Note` text CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NOT NULL,
  `Total_price` double NOT NULL,
  `Created_booking` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `Status` enum('pending','confirmed','processing','completed','cancelled') CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NOT NULL DEFAULT 'pending',
  `Id_store` int NOT NULL,
  `Id_user` int NOT NULL,
  `Id_stylist` int NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Đang đổ dữ liệu cho bảng `bookings`
--

INSERT INTO `bookings` (`Id_booking`, `Booking_date`, `Start_time`, `End_time`, `Phone`, `Note`, `Total_price`, `Created_booking`, `Status`, `Id_store`, `Id_user`, `Id_stylist`) VALUES
(1, '2026-01-12', '2026-01-12 08:00:00', NULL, '0563110475', 'Đặt lịch theo luồng website.', 150000, '2026-03-25 15:19:40', 'completed', 2, 17, 5),
(2, '2026-01-12', '2026-01-12 08:00:00', NULL, '0397311449', 'Đặt lịch theo luồng website.', 150000, '2026-03-25 15:19:47', 'cancelled', 3, 18, 5),
(3, '2026-01-12', '2026-01-12 08:00:00', NULL, '0563110475', 'Đặt lịch theo luồng website.', 180000, '2026-03-25 15:37:05', 'completed', 1, 17, 8);

-- --------------------------------------------------------

--
-- Cấu trúc bảng cho bảng `booking_detail`
--

CREATE TABLE `booking_detail` (
  `Id_Booking_detail` int NOT NULL,
  `Price_at_booking` double(10,0) NOT NULL,
  `Duration_time` time NOT NULL,
  `Id_booking` int NOT NULL,
  `Id_services` int DEFAULT NULL,
  `Id_combo` int DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Đang đổ dữ liệu cho bảng `booking_detail`
--

INSERT INTO `booking_detail` (`Id_Booking_detail`, `Price_at_booking`, `Duration_time`, `Id_booking`, `Id_services`, `Id_combo`) VALUES
(1, 150000, '00:45:00', 1, 2, NULL),
(2, 150000, '00:45:00', 2, 2, NULL),
(3, 180000, '00:45:00', 3, 8, NULL);

-- --------------------------------------------------------

--
-- Cấu trúc bảng cho bảng `booking_rating`
--

CREATE TABLE `booking_rating` (
  `Id_Booking_rating` int NOT NULL,
  `Rating` int NOT NULL,
  `Id_user` int NOT NULL,
  `Id_booking_detail` int NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Đang đổ dữ liệu cho bảng `booking_rating`
--

INSERT INTO `booking_rating` (`Id_Booking_rating`, `Rating`, `Id_user`, `Id_booking_detail`) VALUES
(2, 4, 40, 2);

-- --------------------------------------------------------

--
-- Cấu trúc bảng cho bảng `booking_result_images`
--

CREATE TABLE `booking_result_images` (
  `Id_Collection_hair` int NOT NULL,
  `Image` text CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NOT NULL,
  `Id_booking` int NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Đang đổ dữ liệu cho bảng `booking_result_images`
--

INSERT INTO `booking_result_images` (`Id_Collection_hair`, `Image`, `Id_booking`) VALUES
(11, 'https://cdn.bestme.vn/images/bestme/cac-kieu-toc-nam-thinh-hanh-2.jpg', 1),
(12, 'https://cdn.bestme.vn/images/bestme/cac-kieu-toc-nam-thinh-hanh-13.jpg', 2),
(13, 'https://cdn.bestme.vn/images/bestme/cac-kieu-toc-nam-thinh-hanh-19.jpg', 3),
(14, 'https://cdn.bestme.vn/images/bestme/cac-kieu-toc-nam-thinh-hanh-1.jpg', 4),
(15, 'https://cdn.bestme.vn/images/bestme/cac-kieu-toc-nam-thinh-hanh-18.jpg', 5),
(16, 'https://cdn.bestme.vn/images/bestme/cac-kieu-toc-nam-thinh-hanh-6.jpg', 6),
(17, 'https://cdn.bestme.vn/images/bestme/cac-kieu-toc-nam-thinh-hanh-14.jpg', 7),
(18, 'https://cdn.bestme.vn/images/bestme/cac-kieu-toc-nam-thinh-hanh-10.jpg', 8),
(19, 'https://cdn.bestme.vn/images/bestme/cac-kieu-toc-nam-thinh-hanh-9.jpg', 9),
(20, 'https://cdn.bestme.vn/images/bestme/cac-kieu-toc-nam-thinh-hanh-21.jpg', 10);

-- --------------------------------------------------------

--
-- Cấu trúc bảng cho bảng `brands`
--

CREATE TABLE `brands` (
  `Id_brand` int NOT NULL,
  `Name_brand` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NOT NULL,
  `Description` text CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci,
  `Logo` text CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Đang đổ dữ liệu cho bảng `brands`
--

INSERT INTO `brands` (`Id_brand`, `Name_brand`, `Description`, `Logo`) VALUES
(1, 'Glanzen', '', NULL),
(2, 'Dr.FORSKIN', '', NULL),
(3, 'REUZEL', '', NULL),
(4, 'THE PLANT BASE', '', NULL),
(5, 'LABORIE DERMA', '', NULL);

-- --------------------------------------------------------

--
-- Cấu trúc bảng cho bảng `categories_product`
--

CREATE TABLE `categories_product` (
  `Id_category_products` int NOT NULL,
  `Name_category` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NOT NULL,
  `Is_active` int NOT NULL DEFAULT '1'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Đang đổ dữ liệu cho bảng `categories_product`
--

INSERT INTO `categories_product` (`Id_category_products`, `Name_category`, `Is_active`) VALUES
(1, 'Sáp vuốt tóc', 0),
(2, 'Gôm giữ nếp', 1),
(3, 'Sữa rửa mặt', 1),
(4, 'Dưỡng da', 1),
(5, 'Tẩy da chết', 0),
(6, 'Mặt nạ', 1),
(7, 'Kem chống nắng', 0),
(8, 'Dầu gội', 0),
(9, 'Dầu xả', 1),
(10, 'Dưỡng tóc', 0),
(11, 'Sữa tắm', 0),
(12, 'Khử mùi cơ thể', 1),
(13, 'Tẩy da chết cơ thể', 0),
(14, 'Cạo râu', 1),
(15, 'Máy cạo râu', 1),
(16, 'Máy massage cơ thể', 0),
(17, 'Máy rửa mặt', 1),
(18, 'Máy sấy tóc', 1);

-- --------------------------------------------------------

--
-- Cấu trúc bảng cho bảng `categories_service`
--

CREATE TABLE `categories_service` (
  `Id_category_service` int NOT NULL,
  `Name` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NOT NULL,
  `Is_active` int NOT NULL DEFAULT '1'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Đang đổ dữ liệu cho bảng `categories_service`
--

INSERT INTO `categories_service` (`Id_category_service`, `Name`, `Is_active`) VALUES
(1, 'Cắt tóc', 1),
(2, 'Uốn', 1),
(3, 'Nhuộm', 1),
(4, 'Thư giãn', 1),
(5, 'Chăm sóc da mặt', 1);

-- --------------------------------------------------------

--
-- Cấu trúc bảng cho bảng `category_news`
--

CREATE TABLE `category_news` (
  `Id_category_news` int NOT NULL,
  `Name_category_news` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NOT NULL,
  `Status` int NOT NULL DEFAULT '1'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Đang đổ dữ liệu cho bảng `category_news`
--

INSERT INTO `category_news` (`Id_category_news`, `Name_category_news`, `Status`) VALUES
(1, 'Khuyến mãi', 1),
(2, 'Kiến thức tóc', 1),
(3, 'Xu hướng', 1),
(4, 'Sản phẩm', 1),
(5, 'Sự kiện', 1);

-- --------------------------------------------------------

--
-- Cấu trúc bảng cho bảng `combos`
--

CREATE TABLE `combos` (
  `Id_combo` int NOT NULL,
  `Name` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NOT NULL,
  `Price` double(10,0) NOT NULL,
  `Status` int NOT NULL DEFAULT '1',
  `Duration_time` int NOT NULL,
  `Description` text CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci,
  `Image_URL` text CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Đang đổ dữ liệu cho bảng `combos`
--

INSERT INTO `combos` (`Id_combo`, `Name`, `Price`, `Status`, `Duration_time`, `Description`, `Image_URL`) VALUES
(2, 'Combo 1', 180000, 0, 60, '• Cắt tóc nam cơ bản + gội sấy nhẹ\n• Massage đầu thư giãn giúp giảm căng thẳng\n• Phù hợp đi làm/đi học, gọn gàng nhanh', NULL),
(3, 'Combo 12', 100000, 0, 55, '• Combo gọn nhanh: cắt tóc + tỉa râu tạo kiểu\n• Làm sạch, chỉnh form gọn gàng theo khuôn mặt\n• Phù hợp khách bận rộn, cần chỉnh sửa nhanh', NULL),
(4, 'combo 55', 980000, 0, 270, '• Cắt tóc + uốn layer tạo form chuẩn\n• Kèm massage đầu thư giãn, giảm mệt mỏi\n• Hợp tóc dày/tóc khó vào nếp, lên form lâu', NULL),
(5, 'Shine Cut Premium', 100000, 1, 90, '• Cắt tóc nam cao cấp: tư vấn kiểu theo dáng mặt\n• Gội đầu massage + massage đầu thư giãn\n• Hoàn thiện tạo kiểu, lịch lãm và chỉn chu', NULL),
(6, 'Uốn tóc định hình', 349000, 1, 90, '• Uốn tóc định hình: tóc vào nếp tự nhiên\n• Chuẩn form khi thức dậy, ít cần sấy vuốt\n• Hợp người bận rộn, muốn giữ nếp bền', NULL),
(7, 'Nhuộm thời trang', 299000, 1, 120, '• Nhuộm màu thời trang theo xu hướng\n• Lên màu chuẩn salon, bảo vệ tóc tối đa\n• Tăng độ nổi bật, thể hiện cá tính', NULL),
(8, 'Gội dưỡng sinh', 50000, 1, 30, '• Gội dưỡng sinh bấm huyệt cổ vai gáy\n• Thư giãn sâu ~30 phút, giảm đau mỏi\n• Phù hợp dân văn phòng, stress nhiều', NULL),
(9, 'Lấy ráy tai êm', 70000, 1, 30, '• Lấy ráy tai kỹ thuật êm, thư giãn\n• Dụng cụ 1 lần, vệ sinh an toàn\n• Cảm giác nhẹ tai, dễ chịu sau dịch vụ', NULL),
(10, 'Chăm sóc da mặt', 50000, 1, 20, '• Chăm sóc da mặt nhanh: làm sạch sâu\n• Tẩy da chết + đắp mặt nạ lạnh\n• Da sáng mịn, giảm nhờn sau 20 phút', NULL),
(11, 'Cắt + Uốn + Nhuộm', 1120000, 1, 300, '• Trọn gói makeover: cắt + uốn texture + nhuộm\n• Tư vấn kiểu/màu theo phong cách & khuôn mặt\n• Lên form rõ nét, diện mạo mới nổi bật', NULL),
(12, 'Khánh Du thần kì', 530000, 1, 135, NULL, '/image/combo/1772805450589.jpg');

-- --------------------------------------------------------

--
-- Cấu trúc bảng cho bảng `combo_detail`
--

CREATE TABLE `combo_detail` (
  `Id_services` int NOT NULL,
  `Id_combo` int NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Đang đổ dữ liệu cho bảng `combo_detail`
--

INSERT INTO `combo_detail` (`Id_services`, `Id_combo`) VALUES
(1, 2),
(27, 2),
(10, 3),
(29, 3),
(1, 4),
(23, 4),
(27, 4),
(29, 4),
(2, 5),
(24, 5),
(27, 5),
(39, 6),
(40, 7),
(41, 8),
(42, 9),
(43, 10),
(2, 11),
(3, 11),
(22, 11),
(8, 12),
(11, 12),
(26, 12);

-- --------------------------------------------------------

--
-- Cấu trúc bảng cho bảng `favorite_products`
--

CREATE TABLE `favorite_products` (
  `Id_Favorite_product` int NOT NULL,
  `Is_active` int NOT NULL DEFAULT '1',
  `Id_product` int NOT NULL,
  `Id_user` int NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Cấu trúc bảng cho bảng `image_products`
--

CREATE TABLE `image_products` (
  `Id_image_product` int NOT NULL,
  `Image_URL` text CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NOT NULL,
  `Id_product` int NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Đang đổ dữ liệu cho bảng `image_products`
--

INSERT INTO `image_products` (`Id_image_product`, `Image_URL`, `Id_product`) VALUES
(2, '/image/sanpham/1772003120094-Gel_RuÌÌa_MaÌ£Ìt_laÌm_saÌ£ch_saÌu,_caÌn_baÌÌng_da_Comfort_Zone_Active_Pureness_Gel_200ml.png', 3),
(3, '/image/sanpham/1772003120101-30SNUAIP-CZ_1.jpg', 3),
(4, '/image/sanpham/1772003120102-30SG2T2L-CZ_2.jpg', 3),
(7, '/image/sanpham/1772244616672-SaÌp_vuoÌÌt_toÌc_Glanzen_Clay_Wax.png', 5),
(8, '/image/sanpham/1772244616680-30SSRLMY-phien_baÌn_limited.jpg', 5),
(9, '/image/sanpham/1772244700366-SaÌp_vuoÌÌt_toÌc_nam_Kevin_Murphy_Rough_Rider_khoÌng_boÌng_giuÌÌ_neÌÌp_toÌc_suoÌÌt.png', 6),
(10, '/image/sanpham/1772245304228-SRM_TraÌm_TraÌ_100g_+_TaÌÌy_da_cheÌÌt_Acsys_plus_Dr.FORSKIN.png', 7),
(12, '/image/sanpham/1772782409612-1772244530595-SaÃÂp_vuoÃÂÃÂt_toÃÂc_Glanzen_Clay_Wax.png', 187),
(13, '/image/sanpham/1772797768909-6f7dc584-8886-4c5f-8b23-4eaad5c2197d.png', 17),
(14, '/image/sanpham/1772797779528-25aab260-bf74-4d0d-a953-69d5f4e69262.png', 16),
(15, '/image/sanpham/1772797792094-35aa0bef-a720-424b-bf4d-15fe5799465c.png', 15),
(16, '/image/sanpham/1772797803761-274c7ec8-9638-4aa6-887b-44368a56db6d.png', 14),
(17, '/image/sanpham/1772797816308-650ed514-e517-4c46-9fd5-a50f001ca691.png', 13),
(18, '/image/sanpham/1772797823527-0754faf4-39f8-49ec-96f5-2fd9a685b5f2.png', 12),
(19, '/image/sanpham/1772798692041-35cb5451-ebab-468f-9a7d-86d989d5ffae.png', 11),
(20, '/image/sanpham/1772798701003-85c5a1ed-e2ff-42b8-b913-fa1fdf8847d8.png', 10),
(21, '/image/sanpham/1772798709321-4cfe1570-1a33-4781-993b-dd29f7276a13.png', 9),
(22, '/image/sanpham/1772798734385-dc8ccc04-0a7d-435f-b423-0d2d330520be.png', 8),
(23, '/image/sanpham/1772798752805-b198bf46-c89f-4597-9d93-79596cd30a3e.png', 5),
(24, '/image/sanpham/1772798763256-0754faf4-39f8-49ec-96f5-2fd9a685b5f2.png', 5),
(25, '/image/sanpham/1772801894117-6ea77ea1-e37f-4cdf-8e69-2e3dad189e0e.png', 27),
(26, '/image/sanpham/1772801900714-6f7ab228-3af7-41b6-a57c-1fbbaadc69ad.png', 26),
(27, '/image/sanpham/1772801906899-56de6cea-81e1-457e-86b8-b4fe650f8a90.png', 25),
(28, '/image/sanpham/1772801912258-a654f1b4-6410-4125-b69d-eacdf96551c4.png', 24),
(29, '/image/sanpham/1772801920504-aa91c187-ddd5-493c-87cd-23486185ef0c.png', 23),
(30, '/image/sanpham/1772801927458-ae390606-7b79-48e5-8384-95176a8a7e21.png', 22),
(31, '/image/sanpham/1772801934641-b125f6fd-75c1-435f-800f-19120e9264d3.png', 21),
(32, '/image/sanpham/1772801941997-d40a97d8-5b6c-4aea-924a-5da430530424.png', 20),
(33, '/image/sanpham/1772801948156-d92d5329-8d83-4142-9e4e-50014c910295.png', 19),
(34, '/image/sanpham/1772801953852-e562efcb-3055-48e9-b313-cf3aa2d9bd80.png', 18);

-- --------------------------------------------------------

--
-- Cấu trúc bảng cho bảng `image_services`
--

CREATE TABLE `image_services` (
  `Id_image_service` int NOT NULL,
  `Image_URL` text CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NOT NULL,
  `Id_services` int NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Đang đổ dữ liệu cho bảng `image_services`
--

INSERT INTO `image_services` (`Id_image_service`, `Image_URL`, `Id_services`) VALUES
(1, 'https://i.pinimg.com/1200x/dd/58/c6/dd58c64d425baafbcd26a95a57fbc849.jpg', 1),
(2, 'https://i.pinimg.com/1200x/73/ca/07/73ca0742e321b5cdefbbdd1e56827c9b.jpg', 2),
(3, 'https://i.pinimg.com/1200x/bc/fb/ec/bcfbec1668da6c39a75ad22806dd9389.jpg', 3),
(4, 'https://i.pinimg.com/736x/2c/35/29/2c35290280f958fec1fba3301f660f05.jpg', 8),
(5, 'https://i.pinimg.com/736x/90/0e/01/900e01ebe808b06460ee5ba7fbbb6396.jpg', 9),
(6, 'https://i.pinimg.com/736x/53/94/f8/5394f8df1ad952911af8de19ade81a22.jpg', 10),
(7, 'https://i.pinimg.com/736x/cf/a2/08/cfa208aeb173ae8ab9d354b5f10968ef.jpg', 11),
(8, 'https://i.pinimg.com/1200x/08/33/1d/08331dc5aac1a8b48fd4f02a2e415a72.jpg', 22),
(9, 'https://i.pinimg.com/736x/ea/af/54/eaaf5499cac0140ab905a0aa37988a7e.jpg', 23),
(10, 'https://i.pinimg.com/736x/40/32/eb/4032eb3de52b9db1baca51791cb6522b.jpg', 24),
(11, 'https://i.pinimg.com/1200x/36/cd/5c/36cd5c06af3357574c5df872ecf3dd25.jpg', 25),
(12, 'https://i.pinimg.com/1200x/08/33/1d/08331dc5aac1a8b48fd4f02a2e415a72.jpg', 26),
(13, 'https://i.pinimg.com/1200x/89/2a/81/892a8160422fb15dd7699d588e031eac.jpg', 27),
(14, 'https://i.pinimg.com/736x/45/55/34/455534e6591ca7d5953ee7ef3d7b030f.jpg', 28),
(15, 'https://i.pinimg.com/1200x/fc/7b/dc/fc7bdc7e51045d37a86a4a7e78feaf95.jpg', 29),
(16, 'https://i.pinimg.com/736x/8d/89/e0/8d89e084cf0f07b5244905fb0b2fce9d.jpg', 30),
(17, 'https://i.pinimg.com/736x/71/47/d5/7147d5d61b3a1549264afdcdfd5d72dc.jpg', 31);

-- --------------------------------------------------------

--
-- Cấu trúc bảng cho bảng `news`
--

CREATE TABLE `news` (
  `Id_news` int NOT NULL,
  `Title` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NOT NULL,
  `Slug` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NOT NULL,
  `Content` text CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NOT NULL,
  `Thumbnail` text CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NOT NULL,
  `Status` int NOT NULL DEFAULT '1',
  `Id_category_news` int NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Đang đổ dữ liệu cho bảng `news`
--

INSERT INTO `news` (`Id_news`, `Title`, `Slug`, `Content`, `Thumbnail`, `Status`, `Id_category_news`) VALUES
(1, 'Ưu đãi tháng 3: Giảm 20% combo cắt + gội', 'uu-dai-thang-3-giam-20-combo', 'Từ 01/03 đến 31/03, khách hàng đặt lịch online sẽ được giảm 20% cho combo cắt + gội. Áp dụng tại tất cả chi nhánh. Số lượng ưu đãi có hạn.', 'https://www.invert.vn/media/ar/kieu-toc-linh-thuy-danh-bo-ket-hop-cua.jpeg', 1, 1),
(2, '5 mẹo giữ nếp tóc bền suốt cả ngày', '5-meo-giu-nep-toc-ben-suot-ngay', 'Để tóc giữ nếp tốt: (1) Sấy đúng hướng, (2) Dùng pre-styling, (3) Chọn sáp phù hợp chất tóc, (4) Chia layer khi vuốt, (5) Khóa nếp bằng gôm nhẹ.', 'https://kenh14cdn.com/2020/7/14/srlandscape-avatar-copy-11-15947442699901801282827-crop-15947442837671991514275.jpg', 1, 2),
(3, 'Top kiểu tóc nam trending 2026', 'top-kieu-toc-nam-trending-2026', 'Các kiểu đang được ưa chuộng: textured crop, side part hiện đại, mullet gọn, two-block, và layer Hàn Quốc. Nên chọn theo dáng mặt và chất tóc.', 'https://kenh14cdn.com/203336854389633024/2023/3/8/photo1678261004372-16782610044881244275216.jpg', 1, 3),
(4, 'Ra mắt dòng sáp mới: giữ nếp mạnh, ít bóng', 'ra-mat-sap-moi-giu-nep-manh-it-bong', 'Dòng sáp mới tập trung vào độ giữ nếp mạnh nhưng dễ gội rửa, finish ít bóng. Phù hợp tóc dày/tóc khó vào nếp. Có sẵn tại cửa hàng & online.', 'https://kenh14cdn.com/2018/11/10/t1-15418237858621362512116-crop-1541823815831826350175.jpg', 1, 4),
(5, 'Workshop chăm sóc tóc & da mặt cuối tuần này', 'workshop-cham-soc-toc-da-mat-cuoi-tuan', 'Workshop hướng dẫn chăm sóc tóc và routine da mặt cơ bản. Có demo sản phẩm và tư vấn 1-1. Đăng ký trước để giữ chỗ.', 'https://tse2.mm.bing.net/th/id/OIP.MHIKe5TL1bsoyddiENM4iwHaEo?pid=Api&P=0&h=180', 1, 5);

-- --------------------------------------------------------

--
-- Cấu trúc bảng cho bảng `orders`
--

CREATE TABLE `orders` (
  `Id_order` int NOT NULL,
  `Created_order` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `Total_amount` double(10,0) NOT NULL,
  `Discount_amount` double(10,0) NOT NULL,
  `Final_amount` double(10,0) NOT NULL,
  `Status` enum('pending','confirmed','processing','completed','cancelled') CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NOT NULL DEFAULT 'pending',
  `Status_payment` int NOT NULL DEFAULT '0',
  `Receiver_name` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NOT NULL,
  `Phone` varchar(13) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NOT NULL,
  `Province` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NOT NULL,
  `Ward` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NOT NULL,
  `Address_detail` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NOT NULL,
  `Id_user` int NOT NULL,
  `Id_payment` int NOT NULL,
  `Id_voucher` int DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Đang đổ dữ liệu cho bảng `orders`
--

INSERT INTO `orders` (`Id_order`, `Created_order`, `Total_amount`, `Discount_amount`, `Final_amount`, `Status`, `Status_payment`, `Receiver_name`, `Phone`, `Province`, `Ward`, `Address_detail`, `Id_user`, `Id_payment`, `Id_voucher`) VALUES
(2, '2026-03-05 07:15:09', 638000, 100000, 538000, 'pending', 0, 'Trần Thị B', '0911111113', 'TP HCM', 'Phường 1', 'Quận 3, TP.HCM', 3, 1, NULL),
(3, '2026-03-05 07:15:10', 638000, 100000, 538000, 'pending', 0, 'Trần Thị B', '0911111113', 'TP HCM', 'Phường 1', 'Quận 3, TP.HCM', 3, 1, NULL),
(4, '2026-03-05 07:32:19', 319000, 50000, 269000, 'pending', 0, 'Huỳnh Ngọc Tiến', '84902275501', 'TP HCM', 'Phường 1', '2/90/22 thiên phước', 20, 1, NULL),
(5, '2026-03-05 07:37:22', 319000, 50000, 269000, 'pending', 0, 'Huỳnh Ngọc Tiến', '84902275501', 'TP HCM', 'Phường 1', '2/90/22 thiên phước', 20, 1, NULL),
(6, '2026-03-05 07:39:35', 319000, 50000, 269000, 'pending', 0, 'Huỳnh Ngọc Tiến', '84902275501', 'TPHCM', 'Phường 25', '2/90/22 thiên phước', 20, 1, NULL),
(7, '2026-03-05 07:50:49', 319000, 0, 319000, 'pending', 0, 'Huỳnh Ngọc Tiến', '84902275501', '9', '9', '2/90/22 thiên phước', 20, 1, NULL),
(8, '2026-03-05 08:32:46', 1276000, 200000, 1076000, 'confirmed', 0, 'Huỳnh Ngọc Tiến', '84902275501', 'Quận Tân Bình', 'Phường 9', '2/90/22 thiên phước', 20, 1, NULL),
(9, '2026-03-05 08:57:23', 1276000, 200000, 1076000, 'pending', 0, 'Huỳnh Ngọc Tiến', '84902275501', 'Quận Tân Bình', '9', '2/90/22 thiên phước', 20, 1, NULL),
(10, '2026-03-06 14:43:10', 269000, 0, 269000, 'pending', 0, 'Trần Thị B', '0911111113', 'Quận 0', 'Phường 9', '2/90/22 thiên phước', 3, 1, NULL),
(11, '2026-03-05 12:01:33', 269000, 0, 269000, 'pending', 0, 'Trần Thị B', '0911111113', 'Quận ', 'Phường 9', '2/90/22 thiên phước', 3, 1, NULL),
(12, '2026-03-05 12:06:58', 990000, 50000, 940000, 'pending', 0, 'Huỳnh Ngọc Tiến', '84902275501', 'Quận 9', 'Phường Tân Bình', '2/90/22 thiên phước', 20, 1, NULL),
(13, '2026-03-06 06:59:35', 319000, 0, 319000, 'cancelled', 0, 'Huỳnh Ngọc Tiến', '0902275501', 'Thành phố Hồ Chí Minh', 'Phường 6', '2/90/22 thiên phước', 20, 1, NULL),
(14, '2026-03-06 14:44:51', 632227, 0, 632227, 'pending', 0, 'Huỳnh Ngọc Tiến', '0902275501', 'Thành phố Hồ Chí Minh', 'Phường 6', '2/90/22 thiên phước', 20, 1, NULL);

-- --------------------------------------------------------

--
-- Cấu trúc bảng cho bảng `order_detail`
--

CREATE TABLE `order_detail` (
  `Id_product` int NOT NULL,
  `Id_order` int NOT NULL,
  `Price` double(10,0) NOT NULL,
  `Quantity` int NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Đang đổ dữ liệu cho bảng `order_detail`
--

INSERT INTO `order_detail` (`Id_product`, `Id_order`, `Price`, `Quantity`) VALUES
(3, 12, 990000, 1),
(5, 2, 319000, 1),
(5, 3, 319000, 1),
(5, 5, 319000, 1),
(5, 14, 319000, 1),
(6, 2, 319000, 1),
(6, 3, 319000, 1),
(6, 4, 319000, 1),
(6, 6, 319000, 1),
(6, 7, 319000, 1),
(6, 8, 319000, 4),
(6, 9, 319000, 4),
(6, 13, 319000, 1),
(7, 10, 269000, 1),
(7, 11, 269000, 1),
(187, 14, 313227, 1);

-- --------------------------------------------------------

--
-- Cấu trúc bảng cho bảng `payment_method`
--

CREATE TABLE `payment_method` (
  `Id_payment_method` int NOT NULL,
  `Name` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Đang đổ dữ liệu cho bảng `payment_method`
--

INSERT INTO `payment_method` (`Id_payment_method`, `Name`) VALUES
(1, 'Thanh toán COD');

-- --------------------------------------------------------

--
-- Cấu trúc bảng cho bảng `products`
--

CREATE TABLE `products` (
  `Id_product` int NOT NULL,
  `Name_product` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NOT NULL,
  `Quantity` int NOT NULL,
  `Size` varchar(10) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci DEFAULT NULL,
  `Price` double(10,0) NOT NULL,
  `Sale_Price` double(10,0) DEFAULT '0',
  `Description` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci,
  `Usage_Instructions` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci,
  `Ingredients` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci,
  `Status` int NOT NULL DEFAULT '1',
  `Id_category_product` int NOT NULL,
  `Id_brand` int NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Đang đổ dữ liệu cho bảng `products`
--

INSERT INTO `products` (`Id_product`, `Name_product`, `Quantity`, `Size`, `Price`, `Sale_Price`, `Description`, `Usage_Instructions`, `Ingredients`, `Status`, `Id_category_product`, `Id_brand`) VALUES
(3, 'Gel Rửa Mặt', 0, '200 ml', 990000, 10, NULL, NULL, NULL, 1, 3, 5),
(5, 'Sáp vuốt tóc nam', 14, NULL, 319000, NULL, NULL, NULL, NULL, 0, 1, 4),
(6, 'Sáp vuốt tóc', 14, '60g', 319000, NULL, NULL, NULL, NULL, 1, 1, 5),
(7, 'Sữa Rửa Mặt Tràm', 19, '100 g ', 269000, NULL, NULL, NULL, NULL, 1, 3, 2),
(8, 'Sáp vuốt tóc Hydra Therapy', 28, NULL, 375188, NULL, NULL, NULL, NULL, 1, 1, 1),
(9, 'Sáp vuốt tóc Ultra Essence', 39, NULL, 263459, NULL, NULL, NULL, NULL, 1, 1, 4),
(10, 'Sáp vuốt tóc Premium Protect', 44, NULL, 242369, NULL, NULL, NULL, NULL, 1, 1, 2),
(11, 'Sáp vuốt tóc Gentle Solution', 34, NULL, 446910, NULL, NULL, NULL, NULL, 1, 1, 4),
(12, 'Sáp vuốt tóc Active Clean', 26, NULL, 252732, NULL, NULL, NULL, NULL, 1, 1, 2),
(13, 'Sáp vuốt tóc Premium Solution', 50, NULL, 204477, NULL, NULL, NULL, NULL, 1, 1, 3),
(14, 'Sáp vuốt tóc Ultra Essence', 25, NULL, 331421, NULL, NULL, NULL, NULL, 1, 1, 3),
(15, 'Sáp vuốt tóc Smooth Boost', 38, NULL, 260475, NULL, NULL, NULL, NULL, 1, 1, 2),
(16, 'Sáp vuốt tóc Revive Therapy', 15, NULL, 263051, NULL, NULL, NULL, NULL, 1, 1, 1),
(17, 'Sáp vuốt tóc Revive Solution', 46, NULL, 272493, NULL, NULL, NULL, NULL, 1, 1, 1),
(18, 'Gôm giữ nếp Active Therapy', 12, NULL, 355169, NULL, NULL, NULL, NULL, 1, 2, 5),
(19, 'Gôm giữ nếp Natural Repair', 12, NULL, 330594, NULL, NULL, NULL, NULL, 1, 2, 4),
(20, 'Gôm giữ nếp Smooth Control', 17, NULL, 181659, NULL, NULL, NULL, NULL, 1, 2, 4),
(21, 'Gôm giữ nếp Elite Solution', 10, NULL, 263699, NULL, NULL, NULL, NULL, 1, 2, 4),
(22, 'Gôm giữ nếp Deep Formula', 20, NULL, 435060, NULL, NULL, NULL, NULL, 1, 2, 3),
(23, 'Gôm giữ nếp Hydra Formula', 30, NULL, 325575, NULL, NULL, NULL, NULL, 1, 2, 3),
(24, 'Gôm giữ nếp Cool Essence', 48, NULL, 212718, NULL, NULL, NULL, NULL, 1, 2, 2),
(25, 'Gôm giữ nếp Natural Therapy', 15, NULL, 298468, NULL, NULL, NULL, NULL, 1, 2, 2),
(26, 'Gôm giữ nếp Premium Style', 13, NULL, 343817, NULL, NULL, NULL, NULL, 1, 2, 1),
(27, 'Gôm giữ nếp Fresh Control', 18, NULL, 300703, NULL, NULL, NULL, NULL, 1, 2, 1),
(28, 'Sữa rửa mặt Fresh Essence', 38, '250ml', 279067, 236463, NULL, NULL, NULL, 1, 3, 3),
(29, 'Sữa rửa mặt Elite Repair', 43, '150ml', 415119, 0, NULL, NULL, NULL, 1, 3, 5),
(30, 'Sữa rửa mặt Deep Energy', 41, '250ml', 312930, 258204, NULL, NULL, NULL, 1, 3, 4),
(31, 'Sữa rửa mặt Cool Energy', 31, '200ml', 245858, 208702, NULL, NULL, NULL, 1, 3, 5),
(32, 'Sữa rửa mặt Fresh Clean', 44, '60g', 400334, 0, NULL, NULL, NULL, 1, 3, 1),
(33, 'Sữa rửa mặt Hydra Energy', 43, '60g', 289782, 0, NULL, NULL, NULL, 1, 3, 4),
(34, 'Sữa rửa mặt Revive Boost', 25, '60g', 201092, 0, NULL, NULL, NULL, 1, 3, 2),
(35, 'Sữa rửa mặt Pure Solution', 20, '100g', 387156, 0, NULL, NULL, NULL, 1, 3, 1),
(36, 'Sữa rửa mặt Fresh Care', 21, '60g', 420258, 304328, NULL, NULL, NULL, 1, 3, 5),
(37, 'Sữa rửa mặt Pure Boost', 18, '200ml', 449476, 401315, NULL, NULL, NULL, 1, 3, 1),
(38, 'Dưỡng da Cool Formula', 32, '200ml', 355575, 261098, NULL, NULL, NULL, 1, 4, 1),
(39, 'Dưỡng da Deep Repair', 14, '250ml', 430716, 0, NULL, NULL, NULL, 1, 4, 2),
(40, 'Dưỡng da Pro Control', 46, '100g', 431318, 0, NULL, NULL, NULL, 1, 4, 5),
(41, 'Dưỡng da Cool Protect', 14, '150ml', 379087, 0, NULL, NULL, NULL, 1, 4, 3),
(42, 'Dưỡng da Smooth Formula', 11, '60g', 278709, 0, NULL, NULL, NULL, 1, 4, 1),
(43, 'Dưỡng da Cool Repair', 43, '100g', 375506, 269529, NULL, NULL, NULL, 1, 4, 4),
(44, 'Dưỡng da Natural Solution', 29, '200ml', 294533, 0, NULL, NULL, NULL, 1, 4, 3),
(45, 'Dưỡng da Elite Formula', 13, '100g', 250850, 213594, NULL, NULL, NULL, 1, 4, 2),
(46, 'Dưỡng da Hydra Protect', 17, '250ml', 281002, 220070, NULL, NULL, NULL, 1, 4, 4),
(47, 'Dưỡng da Smooth Style', 30, '200ml', 294945, 0, NULL, NULL, NULL, 1, 4, 5),
(48, 'Tẩy da chết Revive Control', 19, '250ml', 205211, 0, NULL, NULL, NULL, 1, 5, 2),
(49, 'Tẩy da chết Deep Repair', 32, '100g', 189240, 0, NULL, NULL, NULL, 1, 5, 5),
(50, 'Tẩy da chết Power Protect', 21, '60g', 233623, 0, NULL, NULL, NULL, 1, 5, 2),
(51, 'Tẩy da chết Revive Clean', 44, '250ml', 243402, 0, NULL, NULL, NULL, 1, 5, 1),
(52, 'Tẩy da chết Smooth Control', 12, '150ml', 353103, 0, NULL, NULL, NULL, 1, 5, 1),
(53, 'Tẩy da chết Ultra Solution', 42, '200ml', 275390, 0, NULL, NULL, NULL, 1, 5, 3),
(54, 'Tẩy da chết Gentle Boost', 50, '60g', 180096, 148311, NULL, NULL, NULL, 1, 5, 5),
(55, 'Tẩy da chết Pro Energy', 18, '60g', 393282, 0, NULL, NULL, NULL, 1, 5, 5),
(56, 'Tẩy da chết Pure Style', 25, '200ml', 421652, 0, NULL, NULL, NULL, 1, 5, 2),
(57, 'Tẩy da chết Smooth Care', 26, '150ml', 323965, 0, NULL, NULL, NULL, 1, 5, 4),
(58, 'Mặt nạ Fresh Energy', 45, '200ml', 218751, 189790, NULL, NULL, NULL, 1, 6, 3),
(59, 'Mặt nạ Pro Control', 16, '60g', 350872, 265478, NULL, NULL, NULL, 1, 6, 5),
(60, 'Mặt nạ Cool Solution', 26, '100g', 443161, 318059, NULL, NULL, NULL, 1, 6, 4),
(61, 'Mặt nạ Pro Energy', 22, '60g', 347163, 0, NULL, NULL, NULL, 1, 6, 1),
(62, 'Mặt nạ Smooth Repair', 46, '150ml', 321532, 0, NULL, NULL, NULL, 1, 6, 5),
(63, 'Mặt nạ Pro Repair', 29, '60g', 362834, 0, NULL, NULL, NULL, 1, 6, 3),
(64, 'Mặt nạ Smooth Repair', 28, '150ml', 369661, 0, NULL, NULL, NULL, 1, 6, 2),
(65, 'Mặt nạ Gentle Care', 27, '200ml', 278340, 0, NULL, NULL, NULL, 1, 6, 4),
(66, 'Mặt nạ Pro Repair', 45, '150ml', 392792, 302884, NULL, NULL, NULL, 1, 6, 1),
(67, 'Mặt nạ Natural Boost', 46, '60g', 421037, 0, NULL, NULL, NULL, 1, 6, 3),
(68, 'Kem chống nắng Smooth Essence', 15, '200ml', 348750, 0, NULL, NULL, NULL, 1, 7, 4),
(69, 'Kem chống nắng Ultra Therapy', 18, '150ml', 421733, 348240, NULL, NULL, NULL, 1, 7, 5),
(70, 'Kem chống nắng Hydra Essence', 37, '200ml', 232874, 0, NULL, NULL, NULL, 1, 7, 1),
(71, 'Kem chống nắng Elite Boost', 21, '150ml', 383182, 0, NULL, NULL, NULL, 1, 7, 5),
(72, 'Kem chống nắng Revive Care', 22, '60g', 447897, 0, NULL, NULL, NULL, 1, 7, 1),
(73, 'Kem chống nắng Power Style', 32, '100g', 374276, 0, NULL, NULL, NULL, 1, 7, 3),
(74, 'Kem chống nắng Pro Protect', 47, '60g', 446054, 358865, NULL, NULL, NULL, 1, 7, 1),
(75, 'Kem chống nắng Power Formula', 17, '150ml', 265751, 0, NULL, NULL, NULL, 1, 7, 3),
(76, 'Kem chống nắng Elite Formula', 10, '60g', 246681, 0, NULL, NULL, NULL, 1, 7, 3),
(77, 'Kem chống nắng Elite Clean', 11, '60g', 207625, 0, NULL, NULL, NULL, 1, 7, 5),
(78, 'Dầu gội Cool Repair', 26, '250ml', 400726, 0, NULL, NULL, NULL, 1, 8, 5),
(79, 'Dầu gội Pure Clean', 38, '60g', 370272, 307715, NULL, NULL, NULL, 1, 8, 3),
(80, 'Dầu gội Pure Repair', 24, '250ml', 278981, 0, NULL, NULL, NULL, 1, 8, 4),
(81, 'Dầu gội Ultra Repair', 42, '250ml', 249958, 0, NULL, NULL, NULL, 1, 8, 3),
(82, 'Dầu gội Power Repair', 43, '150ml', 327335, 0, NULL, NULL, NULL, 1, 8, 1),
(83, 'Dầu gội Fresh Energy', 31, '60g', 413600, 0, NULL, NULL, NULL, 1, 8, 5),
(84, 'Dầu gội Balance Style', 42, '250ml', 362646, 0, NULL, NULL, NULL, 1, 8, 4),
(85, 'Dầu gội Gentle Therapy', 39, '100g', 369944, 314290, NULL, NULL, NULL, 1, 8, 2),
(86, 'Dầu gội Gentle Protect', 22, '100g', 262886, 0, NULL, NULL, NULL, 1, 8, 3),
(87, 'Dầu gội Gentle Energy', 40, '200ml', 216015, 0, NULL, NULL, NULL, 1, 8, 2),
(88, 'Dầu xả Balance Care', 11, '200ml', 418871, 0, NULL, NULL, NULL, 1, 9, 5),
(89, 'Dầu xả Pro Clean', 14, '150ml', 376747, 0, NULL, NULL, NULL, 1, 9, 4),
(90, 'Dầu xả Elite Control', 11, '250ml', 310992, 0, NULL, NULL, NULL, 1, 9, 3),
(91, 'Dầu xả Smooth Repair', 24, '100g', 203142, 175042, NULL, NULL, NULL, 1, 9, 1),
(92, 'Dầu xả Premium Clean', 23, '200ml', 255294, 0, NULL, NULL, NULL, 1, 9, 3),
(93, 'Dầu xả Ultra Repair', 19, '60g', 393144, 0, NULL, NULL, NULL, 1, 9, 3),
(94, 'Dầu xả Power Boost', 31, '200ml', 389650, 0, NULL, NULL, NULL, 1, 9, 4),
(95, 'Dầu xả Elite Formula', 13, '150ml', 401085, 284054, NULL, NULL, NULL, 1, 9, 1),
(96, 'Dầu xả Pro Boost', 42, '60g', 287533, 0, NULL, NULL, NULL, 1, 9, 2),
(97, 'Dầu xả Pro Protect', 22, '60g', 308410, 225113, NULL, NULL, NULL, 1, 9, 2),
(98, 'Dưỡng tóc Cool Control', 38, '100g', 404062, 325957, NULL, NULL, NULL, 1, 10, 3),
(99, 'Dưỡng tóc Premium Boost', 10, '100g', 320423, 0, NULL, NULL, NULL, 1, 10, 2),
(100, 'Dưỡng tóc Active Control', 46, '150ml', 262222, 0, NULL, NULL, NULL, 1, 10, 4),
(101, 'Dưỡng tóc Ultra Solution', 42, '60g', 244431, 199488, NULL, NULL, NULL, 1, 10, 1),
(102, 'Dưỡng tóc Elite Boost', 31, '100g', 436213, 368141, NULL, NULL, NULL, 1, 10, 2),
(103, 'Dưỡng tóc Gentle Essence', 50, '100g', 345633, 0, NULL, NULL, NULL, 1, 10, 5),
(104, 'Dưỡng tóc Balance Solution', 39, '200ml', 271955, 0, NULL, NULL, NULL, 1, 10, 1),
(105, 'Dưỡng tóc Revive Energy', 29, '150ml', 404666, 0, NULL, NULL, NULL, 1, 10, 1),
(106, 'Dưỡng tóc Hydra Solution', 50, '200ml', 382744, 320141, NULL, NULL, NULL, 1, 10, 1),
(107, 'Dưỡng tóc Cool Essence', 41, '250ml', 286284, 224328, NULL, NULL, NULL, 1, 10, 1),
(108, 'Sữa tắm Power Essence', 40, '100g', 271153, 0, NULL, NULL, NULL, 1, 11, 4),
(109, 'Sữa tắm Revive Boost', 28, '150ml', 222437, 0, NULL, NULL, NULL, 1, 11, 4),
(110, 'Sữa tắm Power Repair', 19, '60g', 288491, 0, NULL, NULL, NULL, 1, 11, 3),
(111, 'Sữa tắm Gentle Therapy', 39, '250ml', 264506, 215456, NULL, NULL, NULL, 1, 11, 3),
(112, 'Sữa tắm Power Boost', 32, '200ml', 391577, 0, NULL, NULL, NULL, 1, 11, 4),
(113, 'Sữa tắm Power Energy', 27, '200ml', 401546, 298374, NULL, NULL, NULL, 1, 11, 5),
(114, 'Sữa tắm Gentle Therapy', 24, '100g', 379841, 0, NULL, NULL, NULL, 1, 11, 4),
(115, 'Sữa tắm Fresh Style', 18, '200ml', 311102, 0, NULL, NULL, NULL, 1, 11, 4),
(116, 'Sữa tắm Active Solution', 21, '150ml', 265281, 235078, NULL, NULL, NULL, 1, 11, 5),
(117, 'Sữa tắm Pure Style', 47, '200ml', 332460, 0, NULL, NULL, NULL, 1, 11, 3),
(118, 'Khử mùi cơ thể Gentle Repair', 38, '60g', 247109, 184439, NULL, NULL, NULL, 1, 12, 1),
(119, 'Khử mùi cơ thể Elite Essence', 33, '60g', 237120, 0, NULL, NULL, NULL, 1, 12, 1),
(120, 'Khử mùi cơ thể Ultra Control', 48, '150ml', 214091, 191031, NULL, NULL, NULL, 1, 12, 2),
(121, 'Khử mùi cơ thể Revive Style', 42, '200ml', 236967, 0, NULL, NULL, NULL, 1, 12, 1),
(122, 'Khử mùi cơ thể Gentle Clean', 31, '60g', 193175, 157950, NULL, NULL, NULL, 1, 12, 4),
(123, 'Khử mùi cơ thể Balance Repair', 34, '100g', 270403, 228424, NULL, NULL, NULL, 1, 12, 1),
(124, 'Khử mùi cơ thể Gentle Formula', 14, '60g', 203353, 0, NULL, NULL, NULL, 1, 12, 5),
(125, 'Khử mùi cơ thể Elite Control', 40, '60g', 382064, 289964, NULL, NULL, NULL, 1, 12, 3),
(126, 'Khử mùi cơ thể Smooth Protect', 16, '100g', 382223, 334531, NULL, NULL, NULL, 1, 12, 4),
(127, 'Khử mùi cơ thể Deep Boost', 38, '200ml', 319633, 253805, NULL, NULL, NULL, 1, 12, 3),
(128, 'Tẩy da chết cơ thể Revive Energy', 39, '250ml', 399530, 0, NULL, NULL, NULL, 1, 13, 1),
(129, 'Tẩy da chết cơ thể Ultra Style', 35, '200ml', 364021, 285352, NULL, NULL, NULL, 1, 13, 3),
(130, 'Tẩy da chết cơ thể Pure Essence', 38, '200ml', 220875, 0, NULL, NULL, NULL, 1, 13, 3),
(131, 'Tẩy da chết cơ thể Pro Care', 12, '250ml', 302103, 0, NULL, NULL, NULL, 1, 13, 2),
(132, 'Tẩy da chết cơ thể Pro Repair', 44, '200ml', 335453, 258702, NULL, NULL, NULL, 1, 13, 1),
(133, 'Tẩy da chết cơ thể Pro Therapy', 44, '250ml', 423522, 304290, NULL, NULL, NULL, 1, 13, 4),
(134, 'Tẩy da chết cơ thể Fresh Boost', 23, '60g', 217643, 172248, NULL, NULL, NULL, 1, 13, 1),
(135, 'Tẩy da chết cơ thể Cool Style', 18, '60g', 414280, 0, NULL, NULL, NULL, 1, 13, 4),
(136, 'Tẩy da chết cơ thể Cool Essence', 48, '100g', 378665, 0, NULL, NULL, NULL, 1, 13, 1),
(137, 'Tẩy da chết cơ thể Pro Essence', 43, '250ml', 200062, 155109, NULL, NULL, NULL, 1, 13, 4),
(138, 'Cạo râu Elite Essence', 41, '250ml', 437042, 330392, NULL, NULL, NULL, 1, 14, 1),
(139, 'Cạo râu Pro Boost', 48, '60g', 231509, 0, NULL, NULL, NULL, 1, 14, 4),
(140, 'Cạo râu Deep Boost', 44, '250ml', 281365, 232501, NULL, NULL, NULL, 1, 14, 3),
(141, 'Cạo râu Fresh Formula', 44, '100g', 433031, 0, NULL, NULL, NULL, 1, 14, 1),
(142, 'Cạo râu Pro Repair', 15, '150ml', 399807, 0, NULL, NULL, NULL, 1, 14, 3),
(143, 'Cạo râu Deep Control', 35, '60g', 420605, 0, NULL, NULL, NULL, 1, 14, 5),
(144, 'Cạo râu Power Care', 18, '250ml', 221037, 0, NULL, NULL, NULL, 1, 14, 2),
(145, 'Cạo râu Deep Boost', 43, '250ml', 221774, 171476, NULL, NULL, NULL, 1, 14, 2),
(146, 'Cạo râu Natural Protect', 11, '250ml', 440306, 340888, NULL, NULL, NULL, 1, 14, 2),
(147, 'Cạo râu Pro Energy', 22, '250ml', 312994, 255637, NULL, NULL, NULL, 1, 14, 5),
(148, 'Máy cạo râu Power Care', 20, '100g', 279174, 201001, NULL, NULL, NULL, 1, 15, 5),
(149, 'Máy cạo râu Revive Repair', 11, '200ml', 271424, 0, NULL, NULL, NULL, 1, 15, 3),
(150, 'Máy cạo râu Smooth Repair', 25, '100g', 206239, 166907, NULL, NULL, NULL, 1, 15, 1),
(151, 'Máy cạo râu Elite Therapy', 15, '200ml', 286304, 0, NULL, NULL, NULL, 1, 15, 1),
(152, 'Máy cạo râu Hydra Boost', 32, '150ml', 314746, 272445, NULL, NULL, NULL, 1, 15, 3),
(153, 'Máy cạo râu Elite Care', 38, '150ml', 390081, 0, NULL, NULL, NULL, 1, 15, 4),
(154, 'Máy cạo râu Deep Control', 36, '100g', 340881, 277390, NULL, NULL, NULL, 1, 15, 3),
(155, 'Máy cạo râu Revive Energy', 36, '150ml', 409233, 323562, NULL, NULL, NULL, 1, 15, 5),
(156, 'Máy cạo râu Smooth Solution', 18, '150ml', 404038, 322029, NULL, NULL, NULL, 1, 15, 2),
(157, 'Máy cạo râu Active Energy', 31, '60g', 391602, 0, NULL, NULL, NULL, 1, 15, 3),
(158, 'Máy massage Balance Control', 10, '250ml', 282015, 0, NULL, NULL, NULL, 1, 16, 5),
(159, 'Máy massage Elite Formula', 13, '250ml', 184046, 0, NULL, NULL, NULL, 1, 16, 5),
(160, 'Máy massage Smooth Style', 34, '200ml', 201239, 166400, NULL, NULL, NULL, 1, 16, 1),
(161, 'Máy massage Gentle Therapy', 38, '150ml', 182984, 0, NULL, NULL, NULL, 1, 16, 3),
(162, 'Máy massage Natural Clean', 27, '150ml', 282166, 0, NULL, NULL, NULL, 1, 16, 1),
(163, 'Máy massage Elite Care', 49, '250ml', 319174, 0, NULL, NULL, NULL, 1, 16, 3),
(164, 'Máy massage Balance Protect', 39, '100g', 405433, 310437, NULL, NULL, NULL, 1, 16, 3),
(165, 'Máy massage Smooth Therapy', 35, '100g', 181096, 127896, NULL, NULL, NULL, 1, 16, 5),
(166, 'Máy massage Gentle Boost', 11, '100g', 315173, 0, NULL, NULL, NULL, 1, 16, 1),
(167, 'Máy massage Pure Formula', 38, '250ml', 317654, 272098, NULL, NULL, NULL, 1, 16, 2),
(168, 'Máy rửa mặt Balance Solution', 38, '100g', 316105, 0, NULL, NULL, NULL, 1, 17, 2),
(169, 'Máy rửa mặt Gentle Style', 50, '200ml', 424720, 0, NULL, NULL, NULL, 1, 17, 5),
(170, 'Máy rửa mặt Pro Therapy', 39, '200ml', 311555, 0, NULL, NULL, NULL, 1, 17, 5),
(171, 'Máy rửa mặt Ultra Therapy', 44, '100g', 448615, 0, NULL, NULL, NULL, 1, 17, 2),
(172, 'Máy rửa mặt Deep Essence', 38, '100g', 266098, 0, NULL, NULL, NULL, 1, 17, 2),
(173, 'Máy rửa mặt Active Style', 38, '60g', 181533, 0, NULL, NULL, NULL, 1, 17, 5),
(174, 'Máy rửa mặt Revive Repair', 14, '250ml', 446351, 356139, NULL, NULL, NULL, 1, 17, 3),
(175, 'Máy rửa mặt Deep Essence', 25, '150ml', 433260, 338735, NULL, NULL, NULL, 1, 17, 4),
(176, 'Máy rửa mặt Smooth Solution', 14, '100g', 426739, 0, NULL, NULL, NULL, 1, 17, 5),
(177, 'Máy rửa mặt Fresh Essence', 35, '250ml', 346318, 281850, NULL, NULL, NULL, 1, 17, 4),
(178, 'Máy sấy tóc Power Care', 21, '250ml', 333660, 0, NULL, NULL, NULL, 1, 18, 4),
(179, 'Máy sấy tóc Ultra Solution', 50, '100g', 345663, 266875, NULL, NULL, NULL, 1, 18, 1),
(180, 'Máy sấy tóc Active Therapy', 23, '100g', 226539, 0, NULL, NULL, NULL, 1, 18, 4),
(181, 'Máy sấy tóc Balance Control', 31, '150ml', 306605, 0, NULL, NULL, NULL, 1, 18, 2),
(182, 'Máy sấy tóc Balance Energy', 14, '150ml', 199277, 0, NULL, NULL, NULL, 1, 18, 4),
(183, 'Máy sấy tóc Cool Energy', 29, '60g', 292451, 0, NULL, NULL, NULL, 1, 18, 1),
(184, 'Máy sấy tóc Elite Therapy', 21, '200ml', 247464, 0, NULL, NULL, NULL, 1, 18, 2),
(185, 'Máy sấy tóc Ultra Clean', 33, '200ml', 186418, 0, NULL, NULL, NULL, 1, 18, 1),
(186, 'Máy sấy tóc Ultra Formula', 46, '60g', 191925, 0, NULL, NULL, NULL, 1, 18, 4),
(187, 'Máy sấy tóc Fresh Energy', 31, NULL, 313227, NULL, NULL, NULL, NULL, 1, 2, 1);

-- --------------------------------------------------------

--
-- Cấu trúc bảng cho bảng `product_comments`
--

CREATE TABLE `product_comments` (
  `Id_product_comment` int NOT NULL,
  `Content` text CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NOT NULL,
  `Created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `Id_user` int NOT NULL,
  `Id_product` int NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Đang đổ dữ liệu cho bảng `product_comments`
--

INSERT INTO `product_comments` (`Id_product_comment`, `Content`, `Created_at`, `Id_user`, `Id_product`) VALUES
(1, 'Đỉnh quá đi thôi', '2026-03-25 15:58:51', 40, 40);

-- --------------------------------------------------------

--
-- Cấu trúc bảng cho bảng `services`
--

CREATE TABLE `services` (
  `Id_services` int NOT NULL,
  `Name` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NOT NULL,
  `Price` double(10,0) NOT NULL,
  `Sale_Price` int NOT NULL DEFAULT '0',
  `Duration_time` int NOT NULL,
  `Description` text CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci,
  `Status` int NOT NULL DEFAULT '1',
  `Id_category_service` int NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Đang đổ dữ liệu cho bảng `services`
--

INSERT INTO `services` (`Id_services`, `Name`, `Price`, `Sale_Price`, `Duration_time`, `Description`, `Status`, `Id_category_service`) VALUES
(1, 'Cắt tóc nam cơ bản', 80000, 0, 30, 'Cắt tóc theo kiểu cơ bản, gội và sấy nhẹ', 1, 1),
(2, 'Cắt tóc nam cao cấp', 150000, 0, 45, 'Tư vấn kiểu tóc phù hợp khuôn mặt, tạo kiểu', 1, 1),
(3, 'Nhuộm màu thời trang', 600000, 0, 120, 'Nhuộm màu theo xu hướng', 1, 3),
(4, 'Nhuộm phủ bạc', 400000, 0, 90, 'Phủ bạc tự nhiên', 1, 3),
(5, 'Nhuộm highlight', 800000, 0, 150, 'Nhuộm tạo điểm nhấn cho tóc', 1, 3),
(8, 'Cắt tóc tạo kiểu Hàn Quốc', 180000, 0, 45, 'Cắt và tạo kiểu theo xu hướng Hàn Quốc', 1, 1),
(9, 'Cạo râu truyền thống', 20000, 0, 20, 'Cạo râu bằng dao truyền thống', 1, 5),
(10, 'Tỉa râu tạo kiểu', 50000, 0, 25, 'Tạo form râu theo khuôn mặt', 1, 5),
(11, 'Cạo râu + massage mặt', 100000, 0, 45, 'Cạo râu kết hợp massage thư giãn', 1, 5),
(12, 'Chăm sóc da mặt cơ bản', 150000, 0, 45, 'Làm sạch và dưỡng da mặt nam', 1, 5),
(13, 'Rửa mặt thải độc da', 120000, 0, 30, 'Làm sạch sâu và giảm nhờn', 1, 5),
(14, 'Nhuộm khói nam', 800000, 0, 180, 'Màu nhuộm khói thời trang', 1, 3),
(15, 'Tẩy tóc nam', 600000, 0, 120, 'Tẩy nền trước khi nhuộm màu sáng', 1, 3),
(20, 'Uốn phồng chân tóc', 400000, 0, 90, 'Tạo độ phồng tự nhiên cho tóc', 1, 2),
(21, 'Uốn con sâu', 700000, 0, 150, 'Kiểu uốn phổ biến cho nam trẻ', 1, 2),
(22, 'Uốn texture', 650000, 0, 140, 'Tạo độ rối tự nhiên', 1, 2),
(23, 'Uốn layer nam', 750000, 0, 180, 'Uốn theo form layer', 1, 2),
(24, 'Gội đầu massage', 50000, 0, 20, 'Gội đầu thư giãn kết hợp massage', 1, 4),
(25, 'Ủ tóc dưỡng chất nam', 150000, 0, 30, 'Cung cấp dưỡng chất cho tóc khô', 1, 4),
(26, 'Detox da đầu nam', 250000, 0, 45, 'Làm sạch sâu da đầu', 1, 4),
(27, 'Massage đầu thư giãn', 100000, 0, 30, 'Massage giúp giảm căng thẳng', 1, 4),
(29, 'cắt tóc 21', 50000, 0, 30, NULL, 1, 3),
(34, 'cắt tóc 22', 300000, 0, 50, NULL, 1, 1),
(36, 'cắt tóc 21', 500000, 0, 30, NULL, 1, 1),
(37, 'cắt tóc 2', 60000, 0, 50, ' ', 1, 1),
(38, 'cắt tóc 21', 50, 0, 10, NULL, 1, 3),
(39, 'Uốn tóc định hình', 349000, 0, 90, 'Tóc đẹp chuẩn form ngay khi thức dậy. Không cần sấy vuốt cầu kỳ.', 1, 2),
(40, 'Nhuộm thời trang', 299000, 0, 120, 'Màu chuẩn salon, bảo vệ tóc tối đa. Lên màu cực chất, khẳng định cá tính.', 1, 3),
(41, 'Gội dưỡng sinh', 50000, 0, 30, 'Massage bấm huyệt cổ vai gáy chuyên sâu 30 phút. Đánh tan đau mỏi, tái tạo năng lượng tức thì.', 1, 4),
(42, 'Lấy ráy tai êm', 70000, 0, 30, 'Kỹ thuật độc quyền \"phê\" quên lối về. Dụng cụ 1 lần, vệ sinh tuyệt đối an toàn cho bạn.', 1, 4),
(43, 'Chăm sóc da mặt', 50000, 0, 20, 'Combo hút mụn, tẩy da chết, đắp mặt nạ lạnh. Da sáng mịn, đầy sức sống chỉ sau 20 phút.', 1, 5);

-- --------------------------------------------------------

--
-- Cấu trúc bảng cho bảng `stores`
--

CREATE TABLE `stores` (
  `Id_store` int NOT NULL,
  `Name_store` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NOT NULL,
  `Image` text CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NOT NULL,
  `Address` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NOT NULL,
  `Province` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NOT NULL,
  `Ward` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NOT NULL,
  `Email` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NOT NULL,
  `Phone` varchar(13) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NOT NULL,
  `Opening_time` time NOT NULL,
  `Closing_time` time NOT NULL,
  `Status` int NOT NULL DEFAULT '1'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Đang đổ dữ liệu cho bảng `stores`
--

INSERT INTO `stores` (`Id_store`, `Name_store`, `Image`, `Address`, `Province`, `Ward`, `Email`, `Phone`, `Opening_time`, `Closing_time`, `Status`) VALUES
(1, '25Zone Quận 1', '', '12 Nguyễn Huệ', 'TP.HCM', 'Bến Nghé', 'q1@25zone.vn', '0901000001', '09:00:00', '21:00:00', 1),
(2, '25Zone Quận 3', '', '45 Võ Văn Tần', 'TP.HCM', 'Phường 6', 'q3@25zone.vn', '0901000002', '09:00:00', '21:30:00', 1),
(3, '25Zone Thủ Đức', '', '120 Võ Văn Ngân', 'TP.HCM', 'Linh Chiểu', 'thuduc@25zone.vn', '0901000003', '08:30:00', '22:00:00', 1),
(4, '25Zone Gò Vấp', '', '88 Quang Trung', 'TP.HCM', 'Phường 10', 'govap@25zone.vn', '0901000004', '09:00:00', '21:00:00', 1),
(5, '25Zone Bình Thạnh', '', '15 D2', 'TP.HCM', 'Phường 25', 'binhthanh@25zone.vn', '0901000005', '09:30:00', '22:00:00', 1),
(6, '25Zone Tân Bình', '', '200 Cộng Hòa', 'TP.HCM', 'Phường 12', 'tanbinh@25zone.vn', '0901000006', '09:00:00', '21:00:00', 1),
(7, '25Zone Phú Nhuận', '', '30 Phan Xích Long', 'TP.HCM', 'Phường 2', 'phunhuan@25zone.vn', '0901000007', '09:00:00', '21:30:00', 1),
(8, '25Zone Quận 7', '', '50 Nguyễn Thị Thập', 'TP.HCM', 'Tân Hưng', 'q7@25zone.vn', '0901000008', '10:00:00', '22:00:00', 1),
(9, '25Zone Tân Phú', '', '99 Lũy Bán Bích', 'TP.HCM', 'Hòa Thạnh', 'tanphu@25zone.vn', '0901000009', '09:00:00', '21:00:00', 1),
(10, '25Zone Bình Tân', '', '300 Tên Lửa', 'TP.HCM', 'Bình Trị Đông B', 'binhtan@25zone.vn', '0901000010', '09:30:00', '21:30:00', 1),
(11, '25ZONE Hà Nội - Ba Đình', '/image/stores/hn-badinh.jpg', '12 Kim Mã', 'Hà Nội', 'Ba Đình', 'hn.badinh@25zone.vn', '0901000011', '09:00:00', '21:00:00', 1),
(12, '25ZONE Hà Nội - Đống Đa', '/image/stores/hn-dongda.jpg', '78 Tây Sơn', 'Hà Nội', 'Đống Đa', 'hn.dongda@25zone.vn', '0901000012', '09:00:00', '21:00:00', 1),
(13, '25ZONE Hà Nội - Nam Từ Liêm', '/image/stores/hn-namtuliem.jpg', '25 Hàm Nghi', 'Hà Nội', 'Nam Từ Liêm', 'hn.namtuliem@25zone.vn', '0901000013', '09:00:00', '21:00:00', 1),
(14, '25ZONE Hà Nội - Hoàng Mai', '/image/stores/hn-hoangmai.jpg', '90 Giải Phóng', 'Hà Nội', 'Hoàng Mai', 'hn.hoangmai@25zone.vn', '0901000014', '09:00:00', '21:00:00', 1),
(15, '25ZONE Hà Nội - Long Biên', '/image/stores/hn-longbien.jpg', '15 Nguyễn Văn Cừ', 'Hà Nội', 'Long Biên', 'hn.longbien@25zone.vn', '0901000015', '09:00:00', '21:00:00', 1),
(16, '25ZONE Đà Nẵng - Thanh Khê', '/image/stores/dn-thanhkhe.jpg', '40 Điện Biên Phủ', 'Đà Nẵng', 'Thanh Khê', 'dn.thanhkhe@25zone.vn', '0901000016', '09:00:00', '21:00:00', 1),
(17, '25ZONE Đà Nẵng - Liên Chiểu', '/image/stores/dn-lienchieu.jpg', '18 Tôn Đức Thắng', 'Đà Nẵng', 'Liên Chiểu', 'dn.lienchieu@25zone.vn', '0901000017', '09:00:00', '21:00:00', 1),
(18, '25ZONE Đà Nẵng - Ngũ Hành Sơn', '/image/stores/dn-nguhanhson.jpg', '66 Trần Đại Nghĩa', 'Đà Nẵng', 'Ngũ Hành Sơn', 'dn.nguhanhson@25zone.vn', '0901000018', '09:00:00', '21:00:00', 1),
(19, '25ZONE Đà Nẵng - Cẩm Lệ', '/image/stores/dn-camle.jpg', '09 Cách Mạng Tháng 8', 'Đà Nẵng', 'Cẩm Lệ', 'dn.camle@25zone.vn', '0901000019', '09:00:00', '21:00:00', 1),
(20, '25ZONE Đà Nẵng - Hòa Vang', '/image/stores/dn-hoavang.jpg', '05 Quốc Lộ 14B', 'Đà Nẵng', 'Hòa Vang', 'dn.hoavang@25zone.vn', '0901000020', '09:00:00', '21:00:00', 1),
(21, '25ZONE Bình Dương - Thuận An', '/image/stores/bd-thuanan.jpg', '21 Nguyễn Văn Tiết', 'Bình Dương', 'Thuận An', 'bd.thuanan@25zone.vn', '0901000021', '09:00:00', '21:00:00', 1),
(22, '25ZONE Bình Dương - Tân Uyên', '/image/stores/bd-tanuyen.jpg', '10 ĐT746', 'Bình Dương', 'Tân Uyên', 'bd.tanuyen@25zone.vn', '0901000022', '09:00:00', '21:00:00', 1),
(23, '25ZONE Bình Dương - Bến Cát', '/image/stores/bd-bencat.jpg', '35 Hùng Vương', 'Bình Dương', 'Bến Cát', 'bd.bencat@25zone.vn', '0901000023', '09:00:00', '21:00:00', 1),
(24, '25ZONE Bình Dương - Phú Giáo', '/image/stores/bd-phugiao.jpg', '08 ĐT741', 'Bình Dương', 'Phú Giáo', 'bd.phugiao@25zone.vn', '0901000024', '09:00:00', '21:00:00', 1),
(25, '25ZONE Bình Dương - Bắc Tân Uyên', '/image/stores/bd-bactanuyen.jpg', '16 ĐT742', 'Bình Dương', 'Bắc Tân Uyên', 'bd.bactanuyen@25zone.vn', '0901000025', '09:00:00', '21:00:00', 1),
(26, '25ZONE Cần Thơ - Bình Thủy', '/image/stores/ct-binhthuy.jpg', '50 Lê Hồng Phong', 'Cần Thơ', 'Bình Thủy', 'ct.binhthuy@25zone.vn', '0901000026', '09:00:00', '21:00:00', 1),
(27, '25ZONE Cần Thơ - Ô Môn', '/image/stores/ct-omon.jpg', '14 Phan Văn Trị', 'Cần Thơ', 'Ô Môn', 'ct.omon@25zone.vn', '0901000027', '09:00:00', '21:00:00', 1),
(28, '25ZONE Cần Thơ - Thốt Nốt', '/image/stores/ct-thotnot.jpg', '29 Lý Tự Trọng', 'Cần Thơ', 'Thốt Nốt', 'ct.thotnot@25zone.vn', '0901000028', '09:00:00', '21:00:00', 1),
(29, '25ZONE Cần Thơ - Phong Điền', '/image/stores/ct-phongdien.jpg', '07 Nguyễn Văn Cừ', 'Cần Thơ', 'Phong Điền', 'ct.phongdien@25zone.vn', '0901000029', '09:00:00', '21:00:00', 1),
(30, '25ZONE Cần Thơ - Thới Lai', '/image/stores/ct-thoilai.jpg', '03 Tỉnh Lộ 922', 'Cần Thơ', 'Thới Lai', 'ct.thoilai@25zone.vn', '0901000030', '09:00:00', '21:00:00', 1),
(31, '25ZONE Hải Phòng - Hồng Bàng', '/image/stores/hp-hongbang.jpg', '33 Hùng Vương', 'Hải Phòng', 'Hồng Bàng', 'hp.hongbang@25zone.vn', '0901000031', '09:00:00', '21:00:00', 1),
(32, '25ZONE Hải Phòng - Kiến An', '/image/stores/hp-kienan.jpg', '19 Trần Nhân Tông', 'Hải Phòng', 'Kiến An', 'hp.kienan@25zone.vn', '0901000032', '09:00:00', '21:00:00', 1),
(33, '25ZONE Hải Phòng - Hải An', '/image/stores/hp-haian.jpg', '55 Lê Hồng Phong', 'Hải Phòng', 'Hải An', 'hp.haian@25zone.vn', '0901000033', '09:00:00', '21:00:00', 1),
(34, '25ZONE Hải Phòng - Đồ Sơn', '/image/stores/hp-doson.jpg', '06 Lý Thánh Tông', 'Hải Phòng', 'Đồ Sơn', 'hp.doson@25zone.vn', '0901000034', '09:00:00', '21:00:00', 1),
(35, '25ZONE Hải Phòng - Thủy Nguyên', '/image/stores/hp-thuynguyen.jpg', '20 Quốc Lộ 10', 'Hải Phòng', 'Thủy Nguyên', 'hp.thuynguyen@25zone.vn', '0901000035', '09:00:00', '21:00:00', 1);

-- --------------------------------------------------------

--
-- Cấu trúc bảng cho bảng `users`
--

CREATE TABLE `users` (
  `Id_user` int NOT NULL,
  `Name_user` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NOT NULL,
  `Phone` varchar(13) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NOT NULL,
  `Email` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NOT NULL,
  `Pass_word` varchar(255) COLLATE utf8mb4_general_ci NOT NULL,
  `Address` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NOT NULL,
  `Image` text CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci,
  `role` enum('user','stylist','admin','staff') CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NOT NULL DEFAULT 'user',
  `Id_store` int NOT NULL,
  `Experience` int DEFAULT NULL,
  `Rating` decimal(2,1) DEFAULT NULL,
  `Reset_otp` varchar(10) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci DEFAULT NULL,
  `Reset_otp_expired` datetime DEFAULT NULL,
  `Refresh_token_hash` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci DEFAULT NULL,
  `Refresh_token_expired` datetime DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Đang đổ dữ liệu cho bảng `users`
--

INSERT INTO `users` (`Id_user`, `Name_user`, `Phone`, `Email`, `Pass_word`, `Address`, `Image`, `role`, `Id_store`, `Experience`, `Rating`, `Reset_otp`, `Reset_otp_expired`, `Refresh_token_hash`, `Refresh_token_expired`) VALUES
(1, 'Admin 25Zone', '0911111111', 'admin@25zone.vn', '$2b$10$uLQwUI9wKCanroy6wN4XQ.qiSzGJfv7sIiF8cq0Bj2..7BvsYxX6G', 'TP.HCM', '', 'admin', 1, NULL, NULL, NULL, NULL, 'a98f87d25f6e59349f6150870160f0ff8609aea50a3aff5565fd6be2cded8724', '2026-05-07 20:38:20'),
(2, 'Nguyễn Văn A', '0911111112', 'user1@gmail.com', '$2b$10$ToSZm0Cq2oBxfNydwtrZGuwdg5zyAKOQluPdaUZ3D3dUu3ZBHVQYW', '123 Bình Long, Phường Long Phước, Tỉnh Bình Phước', '', 'user', 1, NULL, NULL, NULL, NULL, NULL, NULL),
(3, 'Trần Thị B', '0911111113', 'user2@gmail.com', '$2b$10$FhlUlzApSKBwYtlmhQGF5uvrOQMN0zs6ylrauX9/hEhTlvF8GScPW', '2/90/22 thiên phước', '', 'user', 2, NULL, NULL, NULL, NULL, NULL, NULL),
(4, 'Lê Văn C', '0911111114', 'staff1@25zone.vn', '123456', 'Gò Vấp, TP.HCM', '', 'staff', 4, NULL, NULL, NULL, NULL, NULL, NULL),
(5, 'Phạm Thị D', '0911111115', 'stylist1@25zone.vn', '123456', 'Thủ Đức, TP.HCM', 'https://i.pinimg.com/736x/55/69/7f/55697fae046b276fcee8186874fb488d.jpg', 'stylist', 3, NULL, NULL, NULL, NULL, NULL, NULL),
(6, 'Hoàng Văn E', '0911111116', 'user3@gmail.com', '123456', 'Bình Thạnh, TP.HCM', '', 'user', 5, NULL, NULL, NULL, NULL, NULL, NULL),
(7, 'Đỗ Thị F', '0911111117', 'staff2@25zone.vn', '123456', 'Tân Bình, TP.HCM', '', 'staff', 6, NULL, NULL, NULL, NULL, NULL, NULL),
(8, 'Nguyễn Văn G', '0911111118', 'stylist2@25zone.vn', '123456', 'Phú Nhuận, TP.HCM', 'https://i.pinimg.com/736x/d6/7c/22/d67c2241293718ceb635f0791ecd78db.jpg', 'stylist', 7, NULL, NULL, NULL, NULL, NULL, NULL),
(9, 'Trần Văn H', '0911111119', 'user4@gmail.com', '123456', 'Quận 7, TP.HCM', '', 'user', 8, NULL, NULL, NULL, NULL, NULL, NULL),
(10, 'Lý Thị K', '0911111120', 'user5@gmail.com', '123456', 'Tân Phú, TP.HCM', '', 'user', 9, NULL, NULL, NULL, NULL, NULL, NULL),
(11, 'Nguyễn Văn An', '0900000001', 'an@salon.com', '123456', 'HCM', 'https://i.pinimg.com/1200x/a2/ab/d1/a2abd1b2dc56051f332a292b9cc6cd1f.jpg', 'stylist', 1, NULL, NULL, NULL, NULL, NULL, NULL),
(12, 'Trần Minh Khoa', '0900000002', 'khoa@salon.com', '123456', 'HCM', 'https://i.pinimg.com/1200x/72/4f/61/724f61d3a704986960f79cf884843b07.jpg', 'stylist', 1, NULL, NULL, NULL, NULL, NULL, NULL),
(13, 'Lê Hoàng Nam', '0900000003', 'nam@salon.com', '123456', 'HCM', 'https://i.pinimg.com/736x/a6/aa/1b/a6aa1b4616783a31c74959298fd52915.jpg', 'stylist', 1, NULL, NULL, NULL, NULL, NULL, NULL),
(14, 'Phạm Tuấn Hưng', '0900000004', 'hung@salon.com', '123456', 'HCM', 'https://i.pinimg.com/1200x/82/77/87/8277876fe5d9af6eed8379a239c5dbb0.jpg', 'stylist', 1, NULL, NULL, NULL, NULL, NULL, NULL),
(17, 'Khách đặt lịch', '0563110475', '0563110475@quick.25zone', 'quick_booking', 'Đặt lịch online', NULL, 'user', 2, NULL, NULL, NULL, NULL, NULL, NULL),
(18, 'Khách đặt lịch', '0397311449', '0397311449@quick.25zone', 'quick_booking', 'Đặt lịch online', NULL, 'user', 3, NULL, NULL, NULL, NULL, NULL, NULL),
(19, 'Nguyễn Khánh Du', '0397311448', 'khanhdunguyen123456@gmail.com', '$2b$10$mOo/cieL21P2cOz7fV2jQOp47WtHTCD9p1SdWWEfIZZs9pAAZt0Vy', 'Chưa cập nhật', NULL, 'user', 1, NULL, NULL, NULL, NULL, 'f4e04579892766ad99354c0cb21f0c6f58c5b8ea62b3b1fd08558c3749220ff9', '2026-05-10 00:33:11'),
(20, 'Huỳnh Ngọc Tiến', '84902275501', 'huynhngoctien2001@gmail.com', '$2b$10$10bm3zzaMTXbMPV6WUC7.O1q5h4YniOdY2y7WDVywMQG02iUFbffC', '2/90/22 thiên phước, Phường 6, Thành phố Hồ Chí Minh', NULL, 'admin', 1, NULL, NULL, NULL, NULL, 'd10e3f8689ef054c894509cb26a0cf7f6997f30d5ff6b43d605b77e7a866f000', '2026-04-05 19:58:04'),
(21, 'Nguyễn Hoàng Huy', '09741046848', 'nguyễnhoànghuy1@25zone.vn', '123456', 'TP.HCM', 'https://i.pinimg.com/736x/3c/39/53/3c395322b582e5f51f82b92828193a6a.jpg', 'stylist', 1, 1, 4.8, NULL, NULL, NULL, NULL),
(22, 'Trần Hoàng Huy', '09436533247', 'trầnhoànghuy1@25zone.vn', '123456', 'TP.HCM', 'https://i.pinimg.com/736x/1f/81/b5/1f81b5b8370eb18941f20ebdddbfb948.jpg', 'stylist', 1, 3, 3.2, NULL, NULL, NULL, NULL),
(23, 'Lê Hoàng Huy', '09714396323', 'lêhoànghuy1@25zone.vn', '123456', 'TP.HCM', 'https://i.pinimg.com/1200x/d3/18/5c/d3185c7ff423a27ffc4ab9e740427ae9.jpg', 'stylist', 1, 2, 4.6, NULL, NULL, NULL, NULL),
(24, 'Phạm Hoàng Huy', '09565309706', 'phạmhoànghuy1@25zone.vn', '123456', 'TP.HCM', 'https://i.pinimg.com/736x/ac/69/c6/ac69c60847eab0bfe068dce2d2076ae0.jpg', 'stylist', 1, 2, 3.6, NULL, NULL, NULL, NULL),
(25, 'Hoàng Hoàng Huy', '09936077212', 'hoànghoànghuy1@25zone.vn', '123456', 'TP.HCM', 'https://i.pinimg.com/736x/61/84/f8/6184f814c0e45527e449f9a5ba8ad6d4.jpg', 'stylist', 1, 8, 3.3, NULL, NULL, NULL, NULL),
(26, 'Vũ Hoàng Huy', '09422816423', 'vũhoànghuy1@25zone.vn', '123456', 'TP.HCM', 'https://i.pinimg.com/1200x/6b/85/7f/6b857f717acab8c97f57a325e6fd6a4d.jpg', 'stylist', 1, 4, 4.5, NULL, NULL, NULL, NULL),
(27, 'Đỗ Hoàng Huy', '09651230590', 'đỗhoànghuy1@25zone.vn', '123456', 'TP.HCM', 'https://i.pinimg.com/1200x/d9/fd/b0/d9fdb0b7389b9a4f8b28557d35c2134b.jpg', 'stylist', 1, 9, 3.7, NULL, NULL, NULL, NULL),
(28, 'Bùi Hoàng Huy', '09382405289', 'bùihoànghuy1@25zone.vn', '123456', 'TP.HCM', 'https://i.pinimg.com/736x/79/5f/8c/795f8cd574456d4fbe7475e32808d4de.jpg', 'stylist', 1, 5, 3.8, NULL, NULL, NULL, NULL),
(29, 'Ngô Hoàng Huy', '09609198652', 'ngôhoànghuy1@25zone.vn', '123456', 'TP.HCM', 'https://i.pinimg.com/736x/4d/07/6e/4d076e0dd826ede7dd619d7fd004b67f.jpg', 'stylist', 1, 7, 4.1, NULL, NULL, NULL, NULL),
(30, 'Phan Hoàng Huy', '09810950822', 'phanhoànghuy1@25zone.vn', '123456', 'TP.HCM', 'https://i.pinimg.com/1200x/a5/3a/ab/a53aab17831a0364da8841de99c7afd9.jpg', 'stylist', 1, 4, 3.3, NULL, NULL, NULL, NULL),
(31, 'Nguyễn Đức Duy', '09927703676', 'nguyễnđứcduy1@25zone.vn', '123456', 'TP.HCM', 'https://i.pinimg.com/736x/7b/ad/3f/7bad3fd53097e8fab2d1b20d1632d482.jpg', 'stylist', 1, 1, 4.4, NULL, NULL, NULL, NULL),
(32, 'Trần Đức Duy', '09320623367', 'trầnđứcduy1@25zone.vn', '123456', 'TP.HCM', 'https://i.pinimg.com/736x/88/3f/1d/883f1d2e5575fd346556f27a171c04d7.jpg', 'stylist', 1, 2, 4.6, NULL, NULL, NULL, NULL),
(33, 'Lê Đức Duy', '09801871573', 'lêđứcduy1@25zone.vn', '123456', 'TP.HCM', 'https://i.pinimg.com/736x/ab/05/54/ab055470153e48004518b794749efa0b.jpg', 'stylist', 1, 5, 4.6, NULL, NULL, NULL, NULL),
(34, 'Phạm Đức Duy', '09792896446', 'phạmđứcduy1@25zone.vn', '123456', 'TP.HCM', 'https://i.pinimg.com/1200x/55/53/9a/55539ac81d67e86c8ade0c0090f26d87.jpg', 'stylist', 1, 5, 4.5, NULL, NULL, NULL, NULL),
(35, 'Hoàng Đức Duy', '09581184749', 'hoàngđứcduy1@25zone.vn', '123456', 'TP.HCM', 'https://i.pinimg.com/736x/b3/db/e8/b3dbe897f87a2d4e610638f7ebf64baf.jpg', 'stylist', 1, 5, 3.9, NULL, NULL, NULL, NULL),
(36, 'Vũ Đức Duy', '09986577389', 'vũđứcduy1@25zone.vn', '123456', 'TP.HCM', 'https://i.pinimg.com/736x/33/07/62/3307628dc54fcb380cf00cb0bb29eed4.jpg', 'stylist', 1, 6, 3.1, NULL, NULL, NULL, NULL),
(37, 'Đỗ Đức Duy', '09434204406', 'đỗđứcduy1@25zone.vn', '123456', 'TP.HCM', 'https://i.pinimg.com/736x/f5/a1/4d/f5a14d7e802f7f6f096fc5f236b8876a.jpg', 'stylist', 1, 8, 4.4, NULL, NULL, NULL, NULL),
(38, 'Bùi Đức Duy', '09198764455', 'bùiđứcduy1@25zone.vn', '123456', 'TP.HCM', 'https://i.pinimg.com/736x/c2/6a/ea/c26aeabbdc52d070051c0992a5776ce8.jpg', 'stylist', 1, 6, 3.5, NULL, NULL, NULL, NULL),
(39, 'Ngô Đức Duy', '09777638889', 'ngôđứcduy1@25zone.vn', '123456', 'TP.HCM', 'https://i.pinimg.com/736x/af/45/82/af458278be1607439acb4d711bc482af.jpg', 'stylist', 1, 10, 4.3, NULL, NULL, NULL, NULL),
(40, 'Phan Đức Duy', '09344472362', 'phanđứcduy1@25zone.vn', '123456', 'TP.HCM', 'https://i.pinimg.com/736x/1f/81/b5/1f81b5b8370eb18941f20ebdddbfb948.jpg', 'stylist', 1, 5, 3.7, NULL, NULL, NULL, NULL),
(41, 'Nguyễn Minh Phúc', '09461540460', 'nguyễnminhphúc1@25zone.vn', '123456', 'TP.HCM', 'https://i.pinimg.com/1200x/76/58/47/765847e8d7c42665d800138a51289e0d.jpg', 'stylist', 1, 10, 4.5, NULL, NULL, NULL, NULL),
(42, 'Trần Minh Phúc', '09822484525', 'trầnminhphúc1@25zone.vn', '123456', 'TP.HCM', 'https://i.pinimg.com/1200x/74/3f/ab/743fabdd5be8fe2c82990b864e738f57.jpg', 'stylist', 1, 8, 3.6, NULL, NULL, NULL, NULL),
(43, 'Lê Minh Phúc', '09437171107', 'lêminhphúc1@25zone.vn', '123456', 'TP.HCM', 'https://i.pinimg.com/736x/9f/71/c3/9f71c37aefea0e4d831d6fc2eee66f14.jpg', 'stylist', 1, 10, 3.8, NULL, NULL, NULL, NULL),
(44, 'Phạm Minh Phúc', '09366607849', 'phạmminhphúc1@25zone.vn', '123456', 'TP.HCM', 'https://i.pinimg.com/736x/e0/8a/99/e08a9969bea736c5b02f8124e63748bb.jpg', 'stylist', 1, 3, 4.0, NULL, NULL, NULL, NULL),
(45, 'Hoàng Minh Phúc', '09625009504', 'hoàngminhphúc1@25zone.vn', '123456', 'TP.HCM', 'https://i.pinimg.com/1200x/20/28/a4/2028a4b394702bf160d8270f45f2f12b.jpg', 'stylist', 1, 5, 4.2, NULL, NULL, NULL, NULL),
(46, 'Vũ Minh Phúc', '09702349917', 'vũminhphúc1@25zone.vn', '123456', 'TP.HCM', 'https://i.pinimg.com/736x/8b/fd/46/8bfd468bd31c4e3ef6b3c36d24e5aecc.jpg', 'stylist', 1, 5, 3.9, NULL, NULL, NULL, NULL),
(47, 'Đỗ Minh Phúc', '09812738276', 'đỗminhphúc1@25zone.vn', '123456', 'TP.HCM', 'https://i.pinimg.com/736x/b5/97/82/b597820278e22c8cb3345a833369babd.jpg', 'stylist', 1, 6, 4.2, NULL, NULL, NULL, NULL),
(48, 'Bùi Minh Phúc', '09355615837', 'bùiminhphúc1@25zone.vn', '123456', 'TP.HCM', 'https://i.pinimg.com/736x/9f/21/06/9f2106eb231a70ac2a5740f9a4ada340.jpg', 'stylist', 1, 6, 3.0, NULL, NULL, NULL, NULL),
(49, 'Ngô Minh Phúc', '09405334972', 'ngôminhphúc1@25zone.vn', '123456', 'TP.HCM', 'https://i.pinimg.com/1200x/96/0a/11/960a113e59d05914c0de85b3f21a2bc2.jpg', 'stylist', 1, 7, 3.6, NULL, NULL, NULL, NULL),
(50, 'Phan Minh Phúc', '09525171609', 'phanminhphúc1@25zone.vn', '123456', 'TP.HCM', 'https://i.pinimg.com/1200x/23/ae/f8/23aef8097c36506ed72689e35c5f46f7.jpg', 'stylist', 1, 5, 3.0, NULL, NULL, NULL, NULL),
(51, 'Nguyễn Quốc Bảo', '09669685952', 'nguyễnquốcbảo1@25zone.vn', '123456', 'TP.HCM', 'https://i.pinimg.com/1200x/76/e9/8f/76e98fbcd5de82632ba838828f883911.jpg', 'stylist', 1, 2, 4.3, NULL, NULL, NULL, NULL),
(52, 'Trần Quốc Bảo', '09895244201', 'trầnquốcbảo1@25zone.vn', '123456', 'TP.HCM', 'https://i.pinimg.com/1200x/36/d6/83/36d68359ed0188a921529ebfee7dd58c.jpg', 'stylist', 1, 5, 4.6, NULL, NULL, NULL, NULL),
(53, 'Lê Quốc Bảo', '09638016940', 'lêquốcbảo1@25zone.vn', '123456', 'TP.HCM', 'https://i.pinimg.com/736x/06/fa/54/06fa54a75e418f394c05da359578d622.jpg', 'stylist', 1, 6, 4.8, NULL, NULL, NULL, NULL),
(54, 'Phạm Quốc Bảo', '09969763222', 'phạmquốcbảo1@25zone.vn', '123456', 'TP.HCM', 'https://i.pinimg.com/1200x/ba/f9/3f/baf93f8f1b79561b14dc2fe4601c21f6.jpg', 'stylist', 1, 1, 4.0, NULL, NULL, NULL, NULL),
(55, 'Hoàng Quốc Bảo', '09254601948', 'hoàngquốcbảo1@25zone.vn', '123456', 'TP.HCM', 'https://i.pinimg.com/736x/68/a2/b2/68a2b296cdf623ea80954a73c81cd1c3.jpg', 'stylist', 1, 5, 4.2, NULL, NULL, NULL, NULL),
(56, 'Vũ Quốc Bảo', '09684550278', 'vũquốcbảo1@25zone.vn', '123456', 'TP.HCM', 'https://i.pinimg.com/736x/f1/08/0a/f1080a4e920790c113a4ca4ef3f3b1af.jpg', 'stylist', 1, 6, 4.1, NULL, NULL, NULL, NULL),
(57, 'Đỗ Quốc Bảo', '09389771153', 'đỗquốcbảo1@25zone.vn', '123456', 'TP.HCM', 'https://i.pinimg.com/1200x/a7/fc/90/a7fc90368c154e075619b28eb2cd59d5.jpg', 'stylist', 1, 10, 4.2, NULL, NULL, NULL, NULL),
(58, 'Bùi Quốc Bảo', '09298836196', 'bùiquốcbảo1@25zone.vn', '123456', 'TP.HCM', 'https://i.pinimg.com/736x/39/72/b7/3972b7156d8892e4b2420e5359b94654.jpg', 'stylist', 1, 4, 5.0, NULL, NULL, NULL, NULL),
(59, 'Ngô Quốc Bảo', '09983076052', 'ngôquốcbảo1@25zone.vn', '123456', 'TP.HCM', 'https://i.pinimg.com/1200x/e4/b6/7b/e4b67bda721e8609ce6a1ab477f49c27.jpg', 'stylist', 1, 10, 4.3, NULL, NULL, NULL, NULL),
(60, 'Phan Quốc Bảo', '09577508372', 'phanquốcbảo1@25zone.vn', '123456', 'TP.HCM', 'https://i.pinimg.com/1200x/00/d4/42/00d44215d2c43d664881270462f21a3a.jpg', 'stylist', 1, 7, 4.6, NULL, NULL, NULL, NULL),
(61, 'Nguyễn Thành Long', '09957617854', 'nguyễnthànhlong1@25zone.vn', '123456', 'TP.HCM', 'https://i.pinimg.com/736x/66/92/96/6692961a1cb07a8dd66839ce35543a6a.jpg', 'stylist', 1, 4, 3.0, NULL, NULL, NULL, NULL),
(62, 'Trần Thành Long', '09916703794', 'trầnthànhlong1@25zone.vn', '123456', 'TP.HCM', 'https://i.pinimg.com/1200x/56/2d/0c/562d0ca3f41caabd8d45504ef9835ae3.jpg', 'stylist', 1, 6, 4.8, NULL, NULL, NULL, NULL),
(63, 'Lê Thành Long', '09880622964', 'lêthànhlong1@25zone.vn', '123456', 'TP.HCM', 'https://i.pinimg.com/736x/fc/b8/0e/fcb80e7c11c39539fe1d67b04baf0e2a.jpg', 'stylist', 1, 7, 4.6, NULL, NULL, NULL, NULL),
(64, 'Phạm Thành Long', '09898836178', 'phạmthànhlong1@25zone.vn', '123456', 'TP.HCM', 'https://i.pinimg.com/1200x/26/97/1c/26971ce866080413f60c73a9b832a055.jpg', 'stylist', 1, 1, 4.5, NULL, NULL, NULL, NULL),
(65, 'Hoàng Thành Long', '09630075734', 'hoàngthànhlong1@25zone.vn', '123456', 'TP.HCM', 'https://i.pinimg.com/1200x/a9/4f/b0/a94fb050f2789352315858f08f5f5220.jpg', 'stylist', 1, 7, 3.8, NULL, NULL, NULL, NULL),
(66, 'Vũ Thành Long', '09237483361', 'vũthànhlong1@25zone.vn', '123456', 'TP.HCM', 'https://i.pinimg.com/1200x/24/d5/8e/24d58edfb5803c9352fc770aa64df269.jpg', 'stylist', 1, 6, 3.4, NULL, NULL, NULL, NULL),
(67, 'Đỗ Thành Long', '09386625515', 'đỗthànhlong1@25zone.vn', '123456', 'TP.HCM', 'https://i.pinimg.com/1200x/33/d2/f9/33d2f95ade19fd65e4f32d6ffc9a2795.jpg', 'stylist', 1, 1, 3.6, NULL, NULL, NULL, NULL),
(68, 'Bùi Thành Long', '09417991955', 'bùithànhlong1@25zone.vn', '123456', 'TP.HCM', 'https://i.pinimg.com/1200x/db/b7/42/dbb742fd040705bd57c6642dafeb4a26.jpg', 'stylist', 1, 9, 3.5, NULL, NULL, NULL, NULL),
(69, 'Ngô Thành Long', '09700468947', 'ngôthànhlong1@25zone.vn', '123456', 'TP.HCM', 'https://i.pinimg.com/1200x/54/2a/56/542a56ea34b08441d0264a3f0d90202b.jpg', 'stylist', 1, 6, 4.8, NULL, NULL, NULL, NULL),
(70, 'Phan Thành Long', '09851734495', 'phanthànhlong1@25zone.vn', '123456', 'TP.HCM', 'https://i.pinimg.com/736x/36/16/e7/3616e74ea27f7b729f95b57ab7cf663e.jpg', 'stylist', 1, 5, 4.2, NULL, NULL, NULL, NULL),
(71, 'Nguyễn Anh Khoa', '09826099527', 'nguyễnanhkhoa1@25zone.vn', '123456', 'TP.HCM', 'https://i.pinimg.com/1200x/3d/d0/5b/3dd05be9d9c4b5895e32abfb8e55319c.jpg', 'stylist', 1, 2, 4.0, NULL, NULL, NULL, NULL),
(72, 'Trần Anh Khoa', '09991132298', 'trầnanhkhoa1@25zone.vn', '123456', 'TP.HCM', 'https://i.pinimg.com/736x/ee/70/f7/ee70f783f68bae7946419926f543ff36.jpg', 'stylist', 1, 5, 3.3, NULL, NULL, NULL, NULL),
(73, 'Lê Anh Khoa', '09485898121', 'lêanhkhoa1@25zone.vn', '123456', 'TP.HCM', 'https://i.pinimg.com/1200x/13/b1/42/13b142a6ccd20693b30515a91f77559d.jpg', 'stylist', 1, 8, 3.7, NULL, NULL, NULL, NULL),
(74, 'Phạm Anh Khoa', '09611279100', 'phạmanhkhoa1@25zone.vn', '123456', 'TP.HCM', 'https://i.pinimg.com/1200x/73/c3/84/73c384065b54c1197a6c130984bd5154.jpg', 'stylist', 1, 8, 3.5, NULL, NULL, NULL, NULL),
(75, 'Hoàng Anh Khoa', '09883080253', 'hoànganhkhoa1@25zone.vn', '123456', 'TP.HCM', 'https://i.pinimg.com/736x/b8/e9/02/b8e9024d2069d40059c4c83de123f521.jpg', 'stylist', 1, 7, 3.8, NULL, NULL, NULL, NULL),
(76, 'Vũ Anh Khoa', '09341886038', 'vũanhkhoa1@25zone.vn', '123456', 'TP.HCM', 'https://i.pinimg.com/736x/f3/26/f6/f326f6734611066909f8cab8736b3cbe.jpg', 'stylist', 1, 1, 4.3, NULL, NULL, NULL, NULL),
(77, 'Đỗ Anh Khoa', '09107717696', 'đỗanhkhoa1@25zone.vn', '123456', 'TP.HCM', 'https://i.pinimg.com/736x/50/9f/46/509f46e367c2e331d9dbb1770183ea4e.jpg', 'stylist', 1, 1, 3.7, NULL, NULL, NULL, NULL),
(78, 'Bùi Anh Khoa', '09486494133', 'bùianhkhoa1@25zone.vn', '123456', 'TP.HCM', 'https://i.pinimg.com/736x/33/ab/3e/33ab3eded4a9596da2f491e7689ded2a.jpg', 'stylist', 1, 2, 4.0, NULL, NULL, NULL, NULL),
(79, 'Ngô Anh Khoa', '09211154326', 'ngôanhkhoa1@25zone.vn', '123456', 'TP.HCM', 'https://i.pinimg.com/736x/91/83/73/9183735904ef162fed233f8d0a0d732d.jpg', 'stylist', 1, 1, 4.8, NULL, NULL, NULL, NULL),
(80, 'Phan Anh Khoa', '09357005955', 'phananhkhoa1@25zone.vn', '123456', 'TP.HCM', 'https://i.pinimg.com/736x/2f/52/58/2f5258d9ccf3cc0f923ac727588493e3.jpg', 'stylist', 1, 8, 4.9, NULL, NULL, NULL, NULL),
(81, 'Nguyễn Gia Khánh', '09559311060', 'nguyễngiakhánh1@25zone.vn', '123456', 'TP.HCM', 'https://i.pinimg.com/736x/95/b5/60/95b56057f779a6ad3bb0b4c54b55a596.jpg', 'stylist', 1, 7, 4.7, NULL, NULL, NULL, NULL),
(82, 'Trần Gia Khánh', '09205725522', 'trầngiakhánh1@25zone.vn', '123456', 'TP.HCM', 'https://i.pinimg.com/736x/65/14/41/65144127c0a26353dae9419f83337e23.jpg', 'stylist', 1, 2, 3.4, NULL, NULL, NULL, NULL),
(83, 'Lê Gia Khánh', '09656644562', 'lêgiakhánh1@25zone.vn', '123456', 'TP.HCM', 'https://i.pinimg.com/1200x/4a/9c/27/4a9c27e245d409840f893e588a3a02b0.jpg', 'stylist', 1, 6, 4.6, NULL, NULL, NULL, NULL),
(84, 'Phạm Gia Khánh', '09376977384', 'phạmgiakhánh1@25zone.vn', '123456', 'TP.HCM', 'https://i.pinimg.com/1200x/db/96/73/db96735004583ebd4cd0d38d90f5bd14.jpg', 'stylist', 1, 3, 3.2, NULL, NULL, NULL, NULL),
(85, 'Hoàng Gia Khánh', '09928789005', 'hoànggiakhánh1@25zone.vn', '123456', 'TP.HCM', 'https://i.pinimg.com/736x/6c/5b/fd/6c5bfd52081617aca23a949c0b49e404.jpg', 'stylist', 1, 3, 4.3, NULL, NULL, NULL, NULL),
(86, 'Vũ Gia Khánh', '09424732534', 'vũgiakhánh1@25zone.vn', '123456', 'TP.HCM', 'https://i.pinimg.com/736x/06/f6/5b/06f65b780c685372665c24ad4dc55a62.jpg', 'stylist', 1, 9, 3.7, NULL, NULL, NULL, NULL),
(87, 'Đỗ Gia Khánh', '09101301037', 'đỗgiakhánh1@25zone.vn', '123456', 'TP.HCM', 'https://i.pinimg.com/736x/c9/02/b1/c902b10518833c7e3d5ecf451dcaad5b.jpg', 'stylist', 1, 1, 3.2, NULL, NULL, NULL, NULL),
(88, 'Bùi Gia Khánh', '09436305992', 'bùigiakhánh1@25zone.vn', '123456', 'TP.HCM', 'https://i.pinimg.com/1200x/ea/54/49/ea54498577f71f2de018aa4717b5a422.jpg', 'stylist', 1, 7, 4.9, NULL, NULL, NULL, NULL),
(89, 'Ngô Gia Khánh', '09869352883', 'ngôgiakhánh1@25zone.vn', '123456', 'TP.HCM', 'https://i.pinimg.com/736x/70/72/df/7072df99a58dd251a43787d92b1a0a64.jpg', 'stylist', 1, 5, 4.5, NULL, NULL, NULL, NULL),
(90, 'Phan Gia Khánh', '09367970379', 'phangiakhánh1@25zone.vn', '123456', 'TP.HCM', 'https://i.pinimg.com/736x/cf/99/cf/cf99cf403c31c909aa7a2f52c2874466.jpg', 'stylist', 1, 3, 4.0, NULL, NULL, NULL, NULL),
(91, 'Nguyễn Tuấn Đạt', '09765103962', 'nguyễntuấnđạt1@25zone.vn', '123456', 'TP.HCM', 'https://i.pinimg.com/736x/35/f9/16/35f9161faf02303483a832a3e170fb81.jpg', 'stylist', 1, 2, 4.0, NULL, NULL, NULL, NULL),
(92, 'Trần Tuấn Đạt', '09173118200', 'trầntuấnđạt1@25zone.vn', '123456', 'TP.HCM', 'https://i.pinimg.com/736x/8a/63/5a/8a635a9e51c42313af3c8ac9bf599206.jpg', 'stylist', 1, 9, 3.5, NULL, NULL, NULL, NULL),
(93, 'Lê Tuấn Đạt', '09591650482', 'lêtuấnđạt1@25zone.vn', '123456', 'TP.HCM', 'https://i.pinimg.com/736x/c6/ae/9b/c6ae9bd5fce9acc63db9cb482287e3a0.jpg', 'stylist', 1, 10, 3.6, NULL, NULL, NULL, NULL),
(94, 'Phạm Tuấn Đạt', '09557848649', 'phạmtuấnđạt1@25zone.vn', '123456', 'TP.HCM', 'https://i.pinimg.com/736x/0a/3d/27/0a3d27bb29d478e413a46e428702060f.jpg', 'stylist', 1, 7, 4.6, NULL, NULL, NULL, NULL),
(95, 'Hoàng Tuấn Đạt', '09953330422', 'hoàngtuấnđạt1@25zone.vn', '123456', 'TP.HCM', 'https://i.pinimg.com/736x/67/98/90/679890f82190fdfad41310d54c603a6f.jpg', 'stylist', 1, 4, 3.1, NULL, NULL, NULL, NULL),
(96, 'Vũ Tuấn Đạt', '09204521794', 'vũtuấnđạt1@25zone.vn', '123456', 'TP.HCM', 'https://i.pinimg.com/736x/41/bf/df/41bfdfc2277c5d4a982dbfe1e6fa9acf.jpg', 'stylist', 1, 5, 4.6, NULL, NULL, NULL, NULL),
(97, 'Đỗ Tuấn Đạt', '09721823554', 'đỗtuấnđạt1@25zone.vn', '123456', 'TP.HCM', 'https://i.pinimg.com/1200x/99/ca/1a/99ca1a688b9a893e28c54785e6ae000b.jpg', 'stylist', 1, 1, 3.5, NULL, NULL, NULL, NULL),
(98, 'Bùi Tuấn Đạt', '09223797368', 'bùituấnđạt1@25zone.vn', '123456', 'TP.HCM', 'https://i.pinimg.com/736x/81/3f/28/813f2838330f7cf6508aa8556d0c657a.jpg', 'stylist', 1, 9, 5.0, NULL, NULL, NULL, NULL),
(99, 'Ngô Tuấn Đạt', '09414554973', 'ngôtuấnđạt1@25zone.vn', '123456', 'TP.HCM', 'https://i.pinimg.com/736x/bc/5c/bf/bc5cbf56d5d621d9c6d2b34eee31ad22.jpg', 'stylist', 1, 8, 4.4, NULL, NULL, NULL, NULL),
(100, 'Phan Tuấn Đạt', '09321870373', 'phantuấnđạt1@25zone.vn', '123456', 'TP.HCM', 'https://i.pinimg.com/1200x/b9/1f/f8/b91ff8340058e08629734dbe2595b0fe.jpg', 'stylist', 1, 2, 4.9, NULL, NULL, NULL, NULL),
(101, 'Nguyễn Hải Nam', '09356647034', 'nguyễnhảinam1@25zone.vn', '123456', 'TP.HCM', 'https://i.pinimg.com/1200x/85/3b/94/853b949f84d7faff3863e74e97783cc0.jpg', 'stylist', 1, 7, 3.4, NULL, NULL, NULL, NULL),
(102, 'Trần Hải Nam', '09241264141', 'trầnhảinam1@25zone.vn', '123456', 'TP.HCM', 'https://i.pinimg.com/1200x/30/02/3a/30023a55e4ccbf0856696cf7db73ca1c.jpg', 'stylist', 1, 2, 4.0, NULL, NULL, NULL, NULL),
(103, 'Lê Hải Nam', '09871662859', 'lêhảinam1@25zone.vn', '123456', 'TP.HCM', 'https://i.pinimg.com/736x/37/26/d3/3726d36e26625d9d03b4736f581a85c7.jpg', 'stylist', 1, 9, 4.1, NULL, NULL, NULL, NULL),
(104, 'Phạm Hải Nam', '09418898392', 'phạmhảinam1@25zone.vn', '123456', 'TP.HCM', 'https://i.pinimg.com/736x/10/85/6c/10856c09ee5feba16918aba4a7eb9077.jpg', 'stylist', 1, 1, 3.6, NULL, NULL, NULL, NULL),
(105, 'Hoàng Hải Nam', '09276975657', 'hoànghảinam1@25zone.vn', '123456', 'TP.HCM', 'https://i.pinimg.com/1200x/83/74/88/8374883d7f829dd37303a095775c4f0d.jpg', 'stylist', 1, 2, 3.2, NULL, NULL, NULL, NULL),
(106, 'Vũ Hải Nam', '09247797464', 'vũhảinam1@25zone.vn', '123456', 'TP.HCM', 'https://i.pinimg.com/736x/36/26/a5/3626a511889ab60f76c53967f8c5f8f2.jpg', 'stylist', 1, 5, 4.7, NULL, NULL, NULL, NULL),
(107, 'Đỗ Hải Nam', '09845455879', 'đỗhảinam1@25zone.vn', '123456', 'TP.HCM', 'https://i.pinimg.com/1200x/85/79/ae/8579ae82b59a6cdc2d4a9c8fbc659c9d.jpg', 'stylist', 1, 7, 4.1, NULL, NULL, NULL, NULL),
(108, 'Bùi Hải Nam', '09845940335', 'bùihảinam1@25zone.vn', '123456', 'TP.HCM', 'https://i.pinimg.com/1200x/b8/fb/8e/b8fb8e0819b3756260b5d569fd5c2fc8.jpg', 'stylist', 1, 6, 3.7, NULL, NULL, NULL, NULL),
(109, 'Ngô Hải Nam', '09947919559', 'ngôhảinam1@25zone.vn', '123456', 'TP.HCM', 'https://i.pinimg.com/736x/80/88/f3/8088f30a19e02d2c57281410a04fa7d3.jpg', 'stylist', 1, 8, 4.7, NULL, NULL, NULL, NULL),
(110, 'Phan Hải Nam', '09993177165', 'phanhảinam1@25zone.vn', '123456', 'TP.HCM', 'https://i.pinimg.com/736x/d4/a7/a8/d4a7a8875abc6335fccfe261f4ed742d.jpg', 'stylist', 1, 5, 3.5, NULL, NULL, NULL, NULL),
(111, 'Nguyễn Minh Sơn', '09960346596', 'nguyễnminhsơn1@25zone.vn', '123456', 'TP.HCM', 'https://i.pinimg.com/736x/fd/6f/17/fd6f173de888755c041c49ab70cfde94.jpg', 'stylist', 1, 1, 3.3, NULL, NULL, NULL, NULL),
(112, 'Trần Minh Sơn', '09711945746', 'trầnminhsơn1@25zone.vn', '123456', 'TP.HCM', 'https://i.pinimg.com/736x/d7/c9/6b/d7c96b5c25786d0ddb6c6855a85190de.jpg', 'stylist', 1, 10, 4.8, NULL, NULL, NULL, NULL),
(113, 'Lê Minh Sơn', '09626303115', 'lêminhsơn1@25zone.vn', '123456', 'TP.HCM', 'https://i.pinimg.com/736x/1b/27/db/1b27db58fbce20e268a0804509bac9b9.jpg', 'stylist', 1, 2, 3.4, NULL, NULL, NULL, NULL),
(114, 'Phạm Minh Sơn', '09481715553', 'phạmminhsơn1@25zone.vn', '123456', 'TP.HCM', 'https://i.pinimg.com/736x/4f/09/e2/4f09e20d9691f17e5b8a4fbb94657e7a.jpg', 'stylist', 1, 6, 3.7, NULL, NULL, NULL, NULL),
(115, 'Hoàng Minh Sơn', '09227061602', 'hoàngminhsơn1@25zone.vn', '123456', 'TP.HCM', 'https://i.pinimg.com/736x/64/f7/40/64f740354ee1cf77ea0ba9cfb9a71038.jpg', 'stylist', 1, 7, 5.0, NULL, NULL, NULL, NULL),
(116, 'Vũ Minh Sơn', '09858609729', 'vũminhsơn1@25zone.vn', '123456', 'TP.HCM', 'https://i.pinimg.com/736x/cd/ee/9a/cdee9a5fda28543d0c73cedc23b975be.jpg', 'stylist', 1, 3, 4.8, NULL, NULL, NULL, NULL),
(117, 'Đỗ Minh Sơn', '09658116589', 'đỗminhsơn1@25zone.vn', '123456', 'TP.HCM', 'https://i.pinimg.com/1200x/e2/9c/28/e29c286f5cea2ad3b675fa2a883e587c.jpg', 'stylist', 1, 5, 3.4, NULL, NULL, NULL, NULL),
(118, 'Bùi Minh Sơn', '09866865946', 'bùiminhsơn1@25zone.vn', '123456', 'TP.HCM', 'https://i.pinimg.com/1200x/2e/1b/1c/2e1b1c4bdd76afa815801a02b807fffa.jpg', 'stylist', 1, 7, 3.9, NULL, NULL, NULL, NULL),
(119, 'Ngô Minh Sơn', '09480129255', 'ngôminhsơn1@25zone.vn', '123456', 'TP.HCM', 'https://i.pinimg.com/736x/83/53/dc/8353dcd9c3c7213be6eaec9771b05369.jpg', 'stylist', 1, 8, 4.2, NULL, NULL, NULL, NULL),
(120, 'Phan Minh Sơn', '09804961348', 'phanminhsơn1@25zone.vn', '123456', 'TP.HCM', 'https://i.pinimg.com/736x/6c/51/93/6c51937be8eee90665a1003dd97a0380.jpg', 'stylist', 1, 1, 4.8, NULL, NULL, NULL, NULL),
(121, 'Nguyễn Hoàng Huy', '09333419452', 'nguyễnhoànghuy2@25zone.vn', '123456', 'TP.HCM', 'https://i.pinimg.com/736x/5a/3f/a8/5a3fa8baa4ee27e4b4fd4d05e6c3d46c.jpg', 'stylist', 2, 7, 4.0, NULL, NULL, NULL, NULL),
(122, 'Trần Hoàng Huy', '09639601223', 'trầnhoànghuy2@25zone.vn', '123456', 'TP.HCM', 'https://i.pinimg.com/736x/51/a6/71/51a671a743d24e8aff7cbb45db0f5e21.jpg', 'stylist', 2, 5, 3.9, NULL, NULL, NULL, NULL),
(123, 'Lê Hoàng Huy', '09965774169', 'lêhoànghuy2@25zone.vn', '123456', 'TP.HCM', 'https://i.pinimg.com/736x/86/60/84/866084f4779addf7da969002f74aa5c3.jpg', 'stylist', 2, 5, 3.4, NULL, NULL, NULL, NULL),
(124, 'Phạm Hoàng Huy', '09792702022', 'phạmhoànghuy2@25zone.vn', '123456', 'TP.HCM', 'https://i.pinimg.com/736x/c2/13/52/c21352ff49db06d0c07e7fb360adbfce.jpg', 'stylist', 2, 3, 4.7, NULL, NULL, NULL, NULL),
(125, 'Hoàng Hoàng Huy', '09640260719', 'hoànghoànghuy2@25zone.vn', '123456', 'TP.HCM', 'https://i.pinimg.com/736x/c6/4e/c3/c64ec365e4c34a121cc4a6a58ff46312.jpg', 'stylist', 2, 5, 3.6, NULL, NULL, NULL, NULL),
(126, 'Vũ Hoàng Huy', '09317904409', 'vũhoànghuy2@25zone.vn', '123456', 'TP.HCM', 'https://i.pinimg.com/736x/c8/80/b0/c880b03692f6bb185ae8cdb06f20027d.jpg', 'stylist', 2, 4, 4.6, NULL, NULL, NULL, NULL),
(127, 'Đỗ Hoàng Huy', '09245314785', 'đỗhoànghuy2@25zone.vn', '123456', 'TP.HCM', 'https://i.pinimg.com/736x/10/fd/ed/10fded6dcd7d19166dc25d16ec731935.jpg', 'stylist', 2, 4, 3.6, NULL, NULL, NULL, NULL),
(128, 'Bùi Hoàng Huy', '09441765219', 'bùihoànghuy2@25zone.vn', '123456', 'TP.HCM', 'https://i.pinimg.com/736x/c6/f0/76/c6f076143f5c114bfd28937f8c3c50b2.jpg', 'stylist', 2, 1, 3.0, NULL, NULL, NULL, NULL),
(129, 'Ngô Hoàng Huy', '09117719807', 'ngôhoànghuy2@25zone.vn', '123456', 'TP.HCM', 'https://i.pinimg.com/736x/c3/4b/a2/c34ba2eaa1e551fae44908a1141766cd.jpg', 'stylist', 2, 1, 3.2, NULL, NULL, NULL, NULL),
(130, 'Phan Hoàng Huy', '09389925118', 'phanhoànghuy2@25zone.vn', '123456', 'TP.HCM', 'https://i.pinimg.com/736x/a4/5d/82/a45d82d356c7e043517195344e475249.jpg', 'stylist', 2, 4, 4.7, NULL, NULL, NULL, NULL),
(131, 'Nguyễn Đức Duy', '09315576165', 'nguyễnđứcduy2@25zone.vn', '123456', 'TP.HCM', 'https://i.pinimg.com/736x/cf/59/c3/cf59c3b3b0c4968990fe3156ad77fd45.jpg', 'stylist', 2, 6, 3.5, NULL, NULL, NULL, NULL),
(132, 'Trần Đức Duy', '09518116442', 'trầnđứcduy2@25zone.vn', '123456', 'TP.HCM', 'https://i.pinimg.com/1200x/e0/cf/3f/e0cf3fec11f5a1be93a76f1aed44e89c.jpg', 'stylist', 2, 6, 4.0, NULL, NULL, NULL, NULL),
(133, 'Lê Đức Duy', '09728760390', 'lêđứcduy2@25zone.vn', '123456', 'TP.HCM', 'https://i.pinimg.com/1200x/99/50/45/995045093140350f0bea348b29b8a151.jpg', 'stylist', 2, 1, 3.2, NULL, NULL, NULL, NULL),
(134, 'Phạm Đức Duy', '09411688768', 'phạmđứcduy2@25zone.vn', '123456', 'TP.HCM', 'https://i.pinimg.com/736x/0a/cd/48/0acd48390013b6778cdf85f8c69ef7be.jpg', 'stylist', 2, 5, 3.5, NULL, NULL, NULL, NULL),
(135, 'Hoàng Đức Duy', '09858572359', 'hoàngđứcduy2@25zone.vn', '123456', 'TP.HCM', 'https://i.pinimg.com/736x/a3/59/03/a359034b9c4daabfb6509e7f511f1ce6.jpg', 'stylist', 2, 5, 4.8, NULL, NULL, NULL, NULL),
(136, 'Vũ Đức Duy', '09170193533', 'vũđứcduy2@25zone.vn', '123456', 'TP.HCM', 'https://i.pinimg.com/1200x/50/c9/47/50c947d35634d580f99ef139dab3fad0.jpg', 'stylist', 2, 7, 3.2, NULL, NULL, NULL, NULL),
(137, 'Đỗ Đức Duy', '09534030358', 'đỗđứcduy2@25zone.vn', '123456', 'TP.HCM', 'https://i.pinimg.com/1200x/ea/49/72/ea497215ffc9dc72d217f85b67662ea1.jpg', 'stylist', 2, 2, 3.3, NULL, NULL, NULL, NULL),
(138, 'Bùi Đức Duy', '09527204783', 'bùiđứcduy2@25zone.vn', '123456', 'TP.HCM', 'https://i.pinimg.com/1200x/6c/99/49/6c9949b4d223f3843926b49c03526654.jpg', 'stylist', 2, 9, 4.8, NULL, NULL, NULL, NULL),
(139, 'Ngô Đức Duy', '09957564422', 'ngôđứcduy2@25zone.vn', '123456', 'TP.HCM', 'https://i.pinimg.com/736x/55/6f/c9/556fc961f5bc23a2065ec24330ae9851.jpg', 'stylist', 2, 1, 3.6, NULL, NULL, NULL, NULL),
(140, 'Phan Đức Duy', '09470626144', 'phanđứcduy2@25zone.vn', '123456', 'TP.HCM', 'https://i.pinimg.com/736x/32/46/0f/32460f4e330d031614b7bc356d78aa40.jpg', 'stylist', 2, 2, 4.1, NULL, NULL, NULL, NULL),
(141, 'Nguyễn Minh Phúc', '09295853610', 'nguyễnminhphúc2@25zone.vn', '123456', 'TP.HCM', 'https://i.pinimg.com/736x/f9/2d/44/f92d44b9735938ae7ad8f57722933fbd.jpg', 'stylist', 2, 5, 4.5, NULL, NULL, NULL, NULL),
(142, 'Trần Minh Phúc', '09361384386', 'trầnminhphúc2@25zone.vn', '123456', 'TP.HCM', 'https://i.pinimg.com/736x/36/26/5f/36265f96c30a4a2e8228d4acc4490f1e.jpg', 'stylist', 2, 3, 3.4, NULL, NULL, NULL, NULL),
(143, 'Lê Minh Phúc', '09422704891', 'lêminhphúc2@25zone.vn', '123456', 'TP.HCM', 'https://i.pinimg.com/736x/fd/00/bd/fd00bdb4f02b8d9f251d03252120318d.jpg', 'stylist', 2, 2, 4.8, NULL, NULL, NULL, NULL),
(144, 'Phạm Minh Phúc', '09859014336', 'phạmminhphúc2@25zone.vn', '123456', 'TP.HCM', 'https://i.pinimg.com/736x/e8/bf/af/e8bfaf163b585c5feb229760a7fbd9a2.jpg', 'stylist', 2, 6, 3.6, NULL, NULL, NULL, NULL),
(145, 'Hoàng Minh Phúc', '09808116356', 'hoàngminhphúc2@25zone.vn', '123456', 'TP.HCM', 'https://i.pinimg.com/736x/1c/b4/3e/1cb43e7eaa6039092886af2ebd184315.jpg', 'stylist', 2, 1, 4.7, NULL, NULL, NULL, NULL),
(146, 'Vũ Minh Phúc', '09255922948', 'vũminhphúc2@25zone.vn', '123456', 'TP.HCM', 'https://i.pinimg.com/1200x/d7/98/2f/d7982f403c9a05d58a672dd6a471a01f.jpg', 'stylist', 2, 3, 4.8, NULL, NULL, NULL, NULL),
(147, 'Đỗ Minh Phúc', '09654695704', 'đỗminhphúc2@25zone.vn', '123456', 'TP.HCM', 'https://i.pinimg.com/1200x/e0/7b/41/e07b4181069224077a73c304f6586eca.jpg', 'stylist', 2, 5, 3.3, NULL, NULL, NULL, NULL),
(148, 'Bùi Minh Phúc', '09665738227', 'bùiminhphúc2@25zone.vn', '123456', 'TP.HCM', 'https://i.pinimg.com/736x/97/6c/ac/976cacd48ee29393dd7bf4a5ae2a0e85.jpg', 'stylist', 2, 7, 3.6, NULL, NULL, NULL, NULL),
(149, 'Ngô Minh Phúc', '09682275647', 'ngôminhphúc2@25zone.vn', '123456', 'TP.HCM', 'https://i.pinimg.com/1200x/68/29/3a/68293a1cec82149e2cbc4fc2ffa935b8.jpg', 'stylist', 2, 3, 4.1, NULL, NULL, NULL, NULL),
(150, 'Phan Minh Phúc', '09807121090', 'phanminhphúc2@25zone.vn', '123456', 'TP.HCM', 'https://i.pinimg.com/736x/85/e2/2a/85e22a0e5bdef749e9077635315a27e4.jpg', 'stylist', 2, 4, 3.5, NULL, NULL, NULL, NULL),
(151, 'Nguyễn Quốc Bảo', '09448246266', 'nguyễnquốcbảo2@25zone.vn', '123456', 'TP.HCM', 'https://i.pinimg.com/736x/87/a8/0d/87a80d6838e92a6f0a47c320d8730457.jpg', 'stylist', 2, 2, 3.8, NULL, NULL, NULL, NULL),
(152, 'Trần Quốc Bảo', '09767433292', 'trầnquốcbảo2@25zone.vn', '123456', 'TP.HCM', 'https://i.pinimg.com/1200x/39/8b/e1/398be16d14ee68704d05603df9030cc5.jpg', 'stylist', 2, 5, 3.1, NULL, NULL, NULL, NULL),
(153, 'Lê Quốc Bảo', '09892015735', 'lêquốcbảo2@25zone.vn', '123456', 'TP.HCM', 'https://i.pinimg.com/1200x/61/4f/b0/614fb0636a4eb2c2e455ad8e213e3078.jpg', 'stylist', 2, 3, 4.3, NULL, NULL, NULL, NULL),
(154, 'Phạm Quốc Bảo', '09440561454', 'phạmquốcbảo2@25zone.vn', '123456', 'TP.HCM', 'https://i.pinimg.com/1200x/d1/14/38/d114386161db9b7381fd7fc769c7c883.jpg', 'stylist', 2, 1, 4.8, NULL, NULL, NULL, NULL),
(155, 'Hoàng Quốc Bảo', '09560492896', 'hoàngquốcbảo2@25zone.vn', '123456', 'TP.HCM', 'https://i.pinimg.com/736x/f4/93/b5/f493b5a533699e82096af55dd4c578d8.jpg', 'stylist', 2, 9, 4.3, NULL, NULL, NULL, NULL),
(156, 'Vũ Quốc Bảo', '09744273913', 'vũquốcbảo2@25zone.vn', '123456', 'TP.HCM', 'https://i.pinimg.com/736x/84/36/7f/84367fcf3ac0594a47a574a054005602.jpg', 'stylist', 2, 7, 3.2, NULL, NULL, NULL, NULL),
(157, 'Đỗ Quốc Bảo', '09508606356', 'đỗquốcbảo2@25zone.vn', '123456', 'TP.HCM', 'https://i.pinimg.com/736x/a8/80/20/a8802098f7b7fcf2b6a70e4e3f2b36d4.jpg', 'stylist', 2, 1, 4.6, NULL, NULL, NULL, NULL),
(158, 'Bùi Quốc Bảo', '09993114325', 'bùiquốcbảo2@25zone.vn', '123456', 'TP.HCM', 'https://i.pinimg.com/736x/5e/13/42/5e1342745f0fdf2ee601742ff836cf2c.jpg', 'stylist', 2, 6, 4.1, NULL, NULL, NULL, NULL),
(159, 'Ngô Quốc Bảo', '09216775946', 'ngôquốcbảo2@25zone.vn', '123456', 'TP.HCM', 'https://i.pinimg.com/1200x/32/fd/d0/32fdd0a6a8de3e1d54c54c3eafb5a863.jpg', 'stylist', 2, 1, 4.9, NULL, NULL, NULL, NULL),
(160, 'Phan Quốc Bảo', '09627990348', 'phanquốcbảo2@25zone.vn', '123456', 'TP.HCM', 'https://i.pinimg.com/736x/f3/e5/4f/f3e54f135621969d55c4b2413a3f30fb.jpg', 'stylist', 2, 1, 4.0, NULL, NULL, NULL, NULL),
(161, 'Nguyễn Thành Long', '09486278792', 'nguyễnthànhlong2@25zone.vn', '123456', 'TP.HCM', 'https://i.pinimg.com/1200x/94/10/55/941055393b42c1f7bc43fdd0315963eb.jpg', 'stylist', 2, 6, 4.3, NULL, NULL, NULL, NULL),
(162, 'Trần Thành Long', '09546565427', 'trầnthànhlong2@25zone.vn', '123456', 'TP.HCM', 'https://i.pinimg.com/736x/c1/7c/91/c17c91e395e3c4cccd74e0574ed146ce.jpg', 'stylist', 2, 6, 3.3, NULL, NULL, NULL, NULL),
(163, 'Lê Thành Long', '09195708310', 'lêthànhlong2@25zone.vn', '123456', 'TP.HCM', 'https://i.pinimg.com/736x/d5/a0/24/d5a02425f35e7f277290020356e98b2a.jpg', 'stylist', 2, 2, 3.6, NULL, NULL, NULL, NULL),
(164, 'Phạm Thành Long', '09199399711', 'phạmthànhlong2@25zone.vn', '123456', 'TP.HCM', 'https://i.pinimg.com/736x/47/d9/ee/47d9ee92e1e47b0d02499fbf169102da.jpg', 'stylist', 2, 7, 5.0, NULL, NULL, NULL, NULL),
(165, 'Hoàng Thành Long', '09967853978', 'hoàngthànhlong2@25zone.vn', '123456', 'TP.HCM', 'https://i.pinimg.com/736x/d1/02/da/d102dab875e6f6e1c9836a50ba4043ba.jpg', 'stylist', 2, 9, 3.7, NULL, NULL, NULL, NULL),
(166, 'Vũ Thành Long', '09244527604', 'vũthànhlong2@25zone.vn', '123456', 'TP.HCM', 'https://i.pinimg.com/736x/d1/20/a6/d120a652c603c76f074360a636da69b1.jpg', 'stylist', 2, 8, 3.9, NULL, NULL, NULL, NULL),
(167, 'Đỗ Thành Long', '09830152387', 'đỗthànhlong2@25zone.vn', '123456', 'TP.HCM', 'https://i.pinimg.com/736x/21/13/84/211384c5aa24e671d86dc3378ffea2fa.jpg', 'stylist', 2, 8, 3.7, NULL, NULL, NULL, NULL),
(168, 'Bùi Thành Long', '09609947137', 'bùithànhlong2@25zone.vn', '123456', 'TP.HCM', 'https://i.pinimg.com/736x/d7/7e/4d/d77e4d302694b30edad0053e315fae17.jpg', 'stylist', 2, 8, 4.8, NULL, NULL, NULL, NULL),
(169, 'Ngô Thành Long', '09481658011', 'ngôthànhlong2@25zone.vn', '123456', 'TP.HCM', 'https://i.pinimg.com/1200x/b5/44/d0/b544d009de3a87fc689ffb36eed2a257.jpg', 'stylist', 2, 4, 4.1, NULL, NULL, NULL, NULL),
(170, 'Phan Thành Long', '09664069671', 'phanthànhlong2@25zone.vn', '123456', 'TP.HCM', 'https://i.pinimg.com/1200x/9a/69/9d/9a699d7892599b8e934ec86a84765d8e.jpg', 'stylist', 2, 6, 4.3, NULL, NULL, NULL, NULL),
(171, 'Nguyễn Anh Khoa', '09720808871', 'nguyễnanhkhoa2@25zone.vn', '123456', 'TP.HCM', 'https://i.pinimg.com/1200x/e9/29/ff/e929ffb3df03e86b83bd999d9d81d767.jpg', 'stylist', 2, 6, 4.1, NULL, NULL, NULL, NULL),
(172, 'Trần Anh Khoa', '09334830102', 'trầnanhkhoa2@25zone.vn', '123456', 'TP.HCM', 'https://i.pinimg.com/1200x/bf/40/55/bf4055c16dbcb5cd5c5a820a5d95c2e6.jpg', 'stylist', 2, 6, 3.4, NULL, NULL, NULL, NULL),
(173, 'Lê Anh Khoa', '09324570088', 'lêanhkhoa2@25zone.vn', '123456', 'TP.HCM', 'https://i.pinimg.com/736x/32/cf/c4/32cfc4969c9f5f639878ad5b6cc36d3f.jpg', 'stylist', 2, 7, 3.7, NULL, NULL, NULL, NULL),
(174, 'Phạm Anh Khoa', '09925195789', 'phạmanhkhoa2@25zone.vn', '123456', 'TP.HCM', 'https://i.pinimg.com/736x/4d/54/61/4d54615403e403551ba37d55e47ff34c.jpg', 'stylist', 2, 6, 4.7, NULL, NULL, NULL, NULL),
(175, 'Hoàng Anh Khoa', '09652272279', 'hoànganhkhoa2@25zone.vn', '123456', 'TP.HCM', 'https://i.pinimg.com/736x/41/8e/99/418e99f7465a4be27a2bb82eaa322a3d.jpg', 'stylist', 2, 6, 3.0, NULL, NULL, NULL, NULL),
(176, 'Vũ Anh Khoa', '09401497483', 'vũanhkhoa2@25zone.vn', '123456', 'TP.HCM', 'https://i.pinimg.com/736x/cc/f3/87/ccf38750617af8352ca5d9589e7b7ff5.jpg', 'stylist', 2, 7, 3.5, NULL, NULL, NULL, NULL),
(177, 'Đỗ Anh Khoa', '09308448601', 'đỗanhkhoa2@25zone.vn', '123456', 'TP.HCM', 'https://i.pinimg.com/736x/55/36/fb/5536fbc462570ec877539434dc43d01a.jpg', 'stylist', 2, 5, 4.1, NULL, NULL, NULL, NULL),
(178, 'Bùi Anh Khoa', '09535457476', 'bùianhkhoa2@25zone.vn', '123456', 'TP.HCM', 'https://i.pinimg.com/736x/43/69/5d/43695d3c6a5b04f9123dd1a7833958bc.jpg', 'stylist', 2, 8, 3.2, NULL, NULL, NULL, NULL),
(179, 'Ngô Anh Khoa', '09508487377', 'ngôanhkhoa2@25zone.vn', '123456', 'TP.HCM', 'https://i.pinimg.com/736x/e6/5e/b6/e65eb6194e13583ecb40d2c62da00bc3.jpg', 'stylist', 2, 10, 3.4, NULL, NULL, NULL, NULL),
(180, 'Phan Anh Khoa', '09321639769', 'phananhkhoa2@25zone.vn', '123456', 'TP.HCM', 'https://i.pinimg.com/1200x/4a/3b/36/4a3b36508addda7af39409c1afa0ad64.jpg', 'stylist', 2, 7, 3.9, NULL, NULL, NULL, NULL),
(181, 'Nguyễn Gia Khánh', '09502023826', 'nguyễngiakhánh2@25zone.vn', '123456', 'TP.HCM', 'https://i.pinimg.com/736x/34/9c/e2/349ce2fcd544a45f6b0567fc0b2d4af5.jpg', 'stylist', 2, 9, 4.4, NULL, NULL, NULL, NULL),
(182, 'Trần Gia Khánh', '09177633768', 'trầngiakhánh2@25zone.vn', '123456', 'TP.HCM', 'https://i.pinimg.com/736x/12/f8/9e/12f89e9961eafb20c0b4a20010263ecd.jpg', 'stylist', 2, 4, 3.7, NULL, NULL, NULL, NULL),
(183, 'Lê Gia Khánh', '09856059639', 'lêgiakhánh2@25zone.vn', '123456', 'TP.HCM', 'https://i.pinimg.com/736x/50/2a/ce/502acedee82f0533833d03fbbbf97a95.jpg', 'stylist', 2, 2, 3.1, NULL, NULL, NULL, NULL),
(184, 'Phạm Gia Khánh', '09888660901', 'phạmgiakhánh2@25zone.vn', '123456', 'TP.HCM', 'https://i.pinimg.com/736x/3f/e1/39/3fe139c7c796fe2cde513c623701a5af.jpg', 'stylist', 2, 3, 4.3, NULL, NULL, NULL, NULL),
(185, 'Hoàng Gia Khánh', '09479263365', 'hoànggiakhánh2@25zone.vn', '123456', 'TP.HCM', 'https://i.pinimg.com/736x/18/68/dc/1868dcfd62b97ea1cba6d4fe064a786d.jpg', 'stylist', 2, 2, 4.5, NULL, NULL, NULL, NULL),
(186, 'Vũ Gia Khánh', '09147226344', 'vũgiakhánh2@25zone.vn', '123456', 'TP.HCM', 'https://i.pinimg.com/736x/bf/f2/50/bff2506bc38bcec0dd5703de2790cb07.jpg', 'stylist', 2, 1, 3.4, NULL, NULL, NULL, NULL),
(187, 'Đỗ Gia Khánh', '09837998142', 'đỗgiakhánh2@25zone.vn', '123456', 'TP.HCM', 'https://i.pinimg.com/736x/d2/56/9f/d2569f06167e8b0538116760b87d3915.jpg', 'stylist', 2, 5, 4.8, NULL, NULL, NULL, NULL),
(188, 'Bùi Gia Khánh', '09264741609', 'bùigiakhánh2@25zone.vn', '123456', 'TP.HCM', 'https://i.pinimg.com/736x/57/9e/c3/579ec3b27e83bc0c908cbcfff0074968.jpg', 'stylist', 2, 2, 3.4, NULL, NULL, NULL, NULL),
(189, 'Ngô Gia Khánh', '09553380344', 'ngôgiakhánh2@25zone.vn', '123456', 'TP.HCM', 'https://i.pinimg.com/736x/90/63/d8/9063d8b31d652c5afc626a6bb427503a.jpg', 'stylist', 2, 10, 3.5, NULL, NULL, NULL, NULL),
(190, 'Phan Gia Khánh', '09422405562', 'phangiakhánh2@25zone.vn', '123456', 'TP.HCM', 'https://i.pinimg.com/1200x/60/ed/35/60ed359df7196dc10ed7c81abf480dea.jpg', 'stylist', 2, 1, 3.5, NULL, NULL, NULL, NULL),
(191, 'Nguyễn Tuấn Đạt', '09151177177', 'nguyễntuấnđạt2@25zone.vn', '123456', 'TP.HCM', 'https://i.pinimg.com/736x/68/a7/83/68a783425c66ef8a16b60c49bbeeac55.jpg', 'stylist', 2, 6, 4.0, NULL, NULL, NULL, NULL),
(192, 'Trần Tuấn Đạt', '09889225435', 'trầntuấnđạt2@25zone.vn', '123456', 'TP.HCM', 'https://i.pinimg.com/736x/dc/98/c3/dc98c3829efdbac38d00564ba0a6dab1.jpg', 'stylist', 2, 9, 4.7, NULL, NULL, NULL, NULL),
(193, 'Lê Tuấn Đạt', '09656252560', 'lêtuấnđạt2@25zone.vn', '123456', 'TP.HCM', 'https://i.pinimg.com/736x/2a/dd/95/2add953fc99978d01bccadbdeceb7c78.jpg', 'stylist', 2, 6, 4.3, NULL, NULL, NULL, NULL),
(194, 'Phạm Tuấn Đạt', '09791119578', 'phạmtuấnđạt2@25zone.vn', '123456', 'TP.HCM', 'https://i.pinimg.com/736x/c6/f0/d5/c6f0d55762951098dfd3f3b41df335f4.jpg', 'stylist', 2, 9, 3.1, NULL, NULL, NULL, NULL),
(195, 'Hoàng Tuấn Đạt', '09770748590', 'hoàngtuấnđạt2@25zone.vn', '123456', 'TP.HCM', 'https://i.pinimg.com/736x/ff/4e/17/ff4e1770d4854683a99ad423d2cbbcb4.jpg', 'stylist', 2, 6, 3.6, NULL, NULL, NULL, NULL),
(196, 'Vũ Tuấn Đạt', '09899660102', 'vũtuấnđạt2@25zone.vn', '123456', 'TP.HCM', 'https://i.pinimg.com/1200x/70/41/c1/7041c16e8eef369445570ad8ac3b7e19.jpg', 'stylist', 2, 7, 3.7, NULL, NULL, NULL, NULL),
(197, 'Đỗ Tuấn Đạt', '09962597776', 'đỗtuấnđạt2@25zone.vn', '123456', 'TP.HCM', 'https://i.pinimg.com/1200x/8d/a4/fe/8da4fed94eddbcb10c08f3d30950fb74.jpg', 'stylist', 2, 8, 4.6, NULL, NULL, NULL, NULL),
(198, 'Bùi Tuấn Đạt', '09717000803', 'bùituấnđạt2@25zone.vn', '123456', 'TP.HCM', 'https://i.pinimg.com/1200x/09/8f/72/098f720e460642d6516b96360c85ac9a.jpg', 'stylist', 2, 2, 3.9, NULL, NULL, NULL, NULL),
(199, 'Ngô Tuấn Đạt', '09969925829', 'ngôtuấnđạt2@25zone.vn', '123456', 'TP.HCM', 'https://i.pinimg.com/736x/43/8f/96/438f969b2469bbeaca797ef7217e914e.jpg', 'stylist', 2, 5, 3.9, NULL, NULL, NULL, NULL),
(200, 'Phan Tuấn Đạt', '09835046135', 'phantuấnđạt2@25zone.vn', '123456', 'TP.HCM', 'https://i.pinimg.com/736x/84/68/80/8468802559a6735d9a2ece3fc69930ba.jpg', 'stylist', 2, 8, 3.6, NULL, NULL, NULL, NULL),
(201, 'Nguyễn Hải Nam', '09315694910', 'nguyễnhảinam2@25zone.vn', '123456', 'TP.HCM', 'https://i.pinimg.com/736x/cc/25/a7/cc25a7d41309a76e311c5e59b63da3ea.jpg', 'stylist', 2, 4, 4.6, NULL, NULL, NULL, NULL),
(202, 'Trần Hải Nam', '09209348631', 'trầnhảinam2@25zone.vn', '123456', 'TP.HCM', 'https://i.pinimg.com/736x/ee/07/68/ee07684cb6046d0d2ff6c77f385a898f.jpg', 'stylist', 2, 2, 4.1, NULL, NULL, NULL, NULL),
(203, 'Lê Hải Nam', '09324129377', 'lêhảinam2@25zone.vn', '123456', 'TP.HCM', 'https://i.pinimg.com/736x/c5/55/7c/c5557c3e1f58b0c3ddc3868ae00a8e61.jpg', 'stylist', 2, 6, 3.1, NULL, NULL, NULL, NULL),
(204, 'Phạm Hải Nam', '09677938606', 'phạmhảinam2@25zone.vn', '123456', 'TP.HCM', 'https://i.pinimg.com/736x/a1/0d/84/a10d849684f59d7f0bf784f724c49bba.jpg', 'stylist', 2, 1, 3.3, NULL, NULL, NULL, NULL),
(205, 'Hoàng Hải Nam', '09683596800', 'hoànghảinam2@25zone.vn', '123456', 'TP.HCM', 'https://i.pinimg.com/1200x/85/40/9d/85409d3bb12120df7003537d69b3000d.jpg', 'stylist', 2, 9, 3.4, NULL, NULL, NULL, NULL),
(206, 'Vũ Hải Nam', '09583403105', 'vũhảinam2@25zone.vn', '123456', 'TP.HCM', 'https://i.pinimg.com/1200x/67/c1/18/67c1185f60a8464adc71f12640b007f3.jpg', 'stylist', 2, 1, 4.5, NULL, NULL, NULL, NULL),
(207, 'Đỗ Hải Nam', '09515136285', 'đỗhảinam2@25zone.vn', '123456', 'TP.HCM', 'https://i.pinimg.com/736x/27/58/9e/27589e03c734001ea3b2a51f67de3505.jpg', 'stylist', 2, 2, 3.3, NULL, NULL, NULL, NULL),
(208, 'Bùi Hải Nam', '09459020421', 'bùihảinam2@25zone.vn', '123456', 'TP.HCM', 'https://i.pinimg.com/736x/70/7a/40/707a40bd742199d4fcd979ad35a143b1.jpg', 'stylist', 2, 6, 4.3, NULL, NULL, NULL, NULL),
(209, 'Ngô Hải Nam', '09512955480', 'ngôhảinam2@25zone.vn', '123456', 'TP.HCM', 'https://i.pinimg.com/736x/d3/b5/00/d3b500ca40d6acd1834d6d31efb5c15e.jpg', 'stylist', 2, 5, 4.3, NULL, NULL, NULL, NULL),
(210, 'Phan Hải Nam', '09942888534', 'phanhảinam2@25zone.vn', '123456', 'TP.HCM', 'https://i.pinimg.com/736x/3f/44/75/3f4475a9bee20b3407867960cbb63bd5.jpg', 'stylist', 2, 8, 3.4, NULL, NULL, NULL, NULL),
(211, 'Nguyễn Minh Sơn', '09581286295', 'nguyễnminhsơn2@25zone.vn', '123456', 'TP.HCM', 'https://i.pinimg.com/736x/4d/78/e4/4d78e459dc253d0f12890a1eadd2c8f3.jpg', 'stylist', 2, 2, 4.9, NULL, NULL, NULL, NULL),
(212, 'Trần Minh Sơn', '09544914690', 'trầnminhsơn2@25zone.vn', '123456', 'TP.HCM', 'https://i.pinimg.com/736x/bb/d1/0b/bbd10b10bd5ee1629305edc1d3112040.jpg', 'stylist', 2, 6, 3.7, NULL, NULL, NULL, NULL),
(213, 'Lê Minh Sơn', '09198446678', 'lêminhsơn2@25zone.vn', '123456', 'TP.HCM', 'https://i.pinimg.com/736x/2d/09/19/2d09190674c18573c30f6b78106c6e90.jpg', 'stylist', 2, 5, 4.9, NULL, NULL, NULL, NULL),
(214, 'Phạm Minh Sơn', '09463039055', 'phạmminhsơn2@25zone.vn', '123456', 'TP.HCM', 'https://i.pinimg.com/736x/5c/ca/af/5ccaaf5d92e8e1db982ceeafc232ee6a.jpg', 'stylist', 2, 2, 4.1, NULL, NULL, NULL, NULL),
(215, 'Hoàng Minh Sơn', '09385065588', 'hoàngminhsơn2@25zone.vn', '123456', 'TP.HCM', 'https://i.pinimg.com/1200x/19/fb/0d/19fb0dac34a6c797f462e7fcab94c918.jpg', 'stylist', 2, 10, 4.3, NULL, NULL, NULL, NULL),
(216, 'Vũ Minh Sơn', '09503194072', 'vũminhsơn2@25zone.vn', '123456', 'TP.HCM', 'https://i.pinimg.com/736x/5a/b3/e7/5ab3e75bf2665781779abb6df09ae95c.jpg', 'stylist', 2, 4, 3.5, NULL, NULL, NULL, NULL),
(217, 'Đỗ Minh Sơn', '09358756400', 'đỗminhsơn2@25zone.vn', '123456', 'TP.HCM', 'https://i.pinimg.com/736x/b5/7a/b7/b57ab72376dc1da11ea4e891aa7ee072.jpg', 'stylist', 2, 7, 4.2, NULL, NULL, NULL, NULL),
(218, 'Bùi Minh Sơn', '09914273481', 'bùiminhsơn2@25zone.vn', '123456', 'TP.HCM', 'https://i.pinimg.com/736x/75/e2/31/75e2313efdf60591dfd78142f8c85251.jpg', 'stylist', 2, 8, 4.9, NULL, NULL, NULL, NULL),
(219, 'Ngô Minh Sơn', '09655457234', 'ngôminhsơn2@25zone.vn', '123456', 'TP.HCM', 'https://i.pinimg.com/736x/7d/5b/0c/7d5b0ccadab231357e0333b955850cbc.jpg', 'stylist', 2, 2, 3.2, NULL, NULL, NULL, NULL),
(220, 'Phan Minh Sơn', '09951196244', 'phanminhsơn2@25zone.vn', '123456', 'TP.HCM', 'https://i.pinimg.com/1200x/0d/84/30/0d84303291a4c163c7247cf13a7828e8.jpg', 'stylist', 2, 5, 3.5, NULL, NULL, NULL, NULL),
(221, 'Nguyễn Hoàng Huy', '09998355721', 'nguyễnhoànghuy3@25zone.vn', '123456', 'TP.HCM', 'https://i.pinimg.com/736x/40/56/95/405695b69b228b138a0f9ba3007f470c.jpg', 'stylist', 3, 3, 3.4, NULL, NULL, NULL, NULL),
(222, 'Trần Hoàng Huy', '09386160640', 'trầnhoànghuy3@25zone.vn', '123456', 'TP.HCM', 'https://i.pinimg.com/1200x/21/fb/a9/21fba90b7492854b67c2ef8c9620b4b4.jpg', 'stylist', 3, 10, 4.8, NULL, NULL, NULL, NULL),
(223, 'Lê Hoàng Huy', '09537248159', 'lêhoànghuy3@25zone.vn', '123456', 'TP.HCM', 'https://i.pinimg.com/1200x/44/28/e0/4428e0cd5ca10bc4df9e749c4e365cc8.jpg', 'stylist', 3, 8, 4.1, NULL, NULL, NULL, NULL),
(224, 'Phạm Hoàng Huy', '09353516957', 'phạmhoànghuy3@25zone.vn', '123456', 'TP.HCM', 'https://i.pinimg.com/736x/33/b8/92/33b8922bebdcbbbbbed9ae417136e226.jpg', 'stylist', 3, 9, 3.3, NULL, NULL, NULL, NULL),
(225, 'Hoàng Hoàng Huy', '09475657765', 'hoànghoànghuy3@25zone.vn', '123456', 'TP.HCM', 'https://i.pinimg.com/736x/76/03/cf/7603cfded78eb3b028654a991aabbf3b.jpg', 'stylist', 3, 6, 4.4, NULL, NULL, NULL, NULL),
(226, 'Vũ Hoàng Huy', '09807664803', 'vũhoànghuy3@25zone.vn', '123456', 'TP.HCM', 'https://i.pinimg.com/736x/1e/6e/d9/1e6ed974b9425458574ce95a01dd1120.jpg', 'stylist', 3, 8, 4.2, NULL, NULL, NULL, NULL),
(227, 'Đỗ Hoàng Huy', '09670426133', 'đỗhoànghuy3@25zone.vn', '123456', 'TP.HCM', 'https://i.pinimg.com/736x/c7/60/4a/c7604ae1c3eeb6876aa411c5234b59fe.jpg', 'stylist', 3, 4, 4.8, NULL, NULL, NULL, NULL),
(228, 'Bùi Hoàng Huy', '09527142464', 'bùihoànghuy3@25zone.vn', '123456', 'TP.HCM', 'https://i.pinimg.com/736x/03/28/97/0328978411ba346f718acf6958776c1d.jpg', 'stylist', 3, 7, 4.5, NULL, NULL, NULL, NULL),
(229, 'Ngô Hoàng Huy', '09869893005', 'ngôhoànghuy3@25zone.vn', '123456', 'TP.HCM', 'https://i.pinimg.com/736x/cd/4d/75/cd4d75fe7a5d698e941dc2f37e3fe7a4.jpg', 'stylist', 3, 1, 4.1, NULL, NULL, NULL, NULL),
(230, 'Phan Hoàng Huy', '09658595425', 'phanhoànghuy3@25zone.vn', '123456', 'TP.HCM', 'https://i.pinimg.com/736x/6d/89/95/6d89954f7b68bdce81df9b9f81fca0ae.jpg', 'stylist', 3, 5, 4.2, NULL, NULL, NULL, NULL),
(231, 'Nguyễn Đức Duy', '09600524325', 'nguyễnđứcduy3@25zone.vn', '123456', 'TP.HCM', 'https://i.pinimg.com/736x/6f/a1/c3/6fa1c356199c788289fdaf2fde224998.jpg', 'stylist', 3, 10, 3.2, NULL, NULL, NULL, NULL),
(232, 'Trần Đức Duy', '09759870999', 'trầnđứcduy3@25zone.vn', '123456', 'TP.HCM', 'https://i.pinimg.com/1200x/e6/c1/cc/e6c1ccdd13205c795835b326bc3649f0.jpg', 'stylist', 3, 4, 3.6, NULL, NULL, NULL, NULL),
(233, 'Lê Đức Duy', '09675524695', 'lêđứcduy3@25zone.vn', '123456', 'TP.HCM', 'https://i.pinimg.com/736x/cb/3d/64/cb3d64de7e703a2f26384e553cc56b34.jpg', 'stylist', 3, 3, 3.9, NULL, NULL, NULL, NULL),
(234, 'Phạm Đức Duy', '09425460102', 'phạmđứcduy3@25zone.vn', '123456', 'TP.HCM', 'https://i.pinimg.com/736x/4b/cb/e2/4bcbe228a0a293e7a0a5a2dc3808b66a.jpg', 'stylist', 3, 6, 3.9, NULL, NULL, NULL, NULL),
(235, 'Hoàng Đức Duy', '09697642884', 'hoàngđứcduy3@25zone.vn', '123456', 'TP.HCM', 'https://i.pinimg.com/736x/2d/3c/49/2d3c49467cf8d96fb607c26e2eb78e4a.jpg', 'stylist', 3, 1, 3.2, NULL, NULL, NULL, NULL),
(236, 'Vũ Đức Duy', '09424009439', 'vũđứcduy3@25zone.vn', '123456', 'TP.HCM', 'https://i.pinimg.com/736x/1c/91/61/1c9161bbe6160c2d54a2757707b131f6.jpg', 'stylist', 3, 6, 4.4, NULL, NULL, NULL, NULL),
(237, 'Đỗ Đức Duy', '09884398705', 'đỗđứcduy3@25zone.vn', '123456', 'TP.HCM', 'https://i.pinimg.com/736x/8f/0e/60/8f0e60a1811c9e31babaff14b3a22ba6.jpg', 'stylist', 3, 3, 4.1, NULL, NULL, NULL, NULL),
(238, 'Bùi Đức Duy', '09103643102', 'bùiđứcduy3@25zone.vn', '123456', 'TP.HCM', 'https://i.pinimg.com/736x/04/35/9d/04359dc86fdb11c57ce6eeca35458187.jpg', 'stylist', 3, 5, 5.0, NULL, NULL, NULL, NULL),
(239, 'Ngô Đức Duy', '09812684520', 'ngôđứcduy3@25zone.vn', '123456', 'TP.HCM', 'https://i.pinimg.com/736x/04/ce/4b/04ce4bd43b35a5d195bbe102f919d8c1.jpg', 'stylist', 3, 10, 3.8, NULL, NULL, NULL, NULL),
(240, 'Phan Đức Duy', '09316399363', 'phanđứcduy3@25zone.vn', '123456', 'TP.HCM', 'https://i.pinimg.com/736x/15/a9/c0/15a9c09ad26831135acffde0cf5483ae.jpg', 'stylist', 3, 10, 4.9, NULL, NULL, NULL, NULL),
(241, 'Nguyễn Minh Phúc', '09869468468', 'nguyễnminhphúc3@25zone.vn', '123456', 'TP.HCM', 'https://i.pinimg.com/736x/85/63/25/85632524d32152ecea6c0fc444554e59.jpg', 'stylist', 3, 5, 4.7, NULL, NULL, NULL, NULL),
(242, 'Trần Minh Phúc', '09914696155', 'trầnminhphúc3@25zone.vn', '123456', 'TP.HCM', 'https://i.pinimg.com/1200x/a5/7e/75/a57e75e8b7de1f2c80711997710fb0cd.jpg', 'stylist', 3, 10, 4.6, NULL, NULL, NULL, NULL),
(243, 'Lê Minh Phúc', '09400045313', 'lêminhphúc3@25zone.vn', '123456', 'TP.HCM', 'https://i.pinimg.com/1200x/77/39/b6/7739b65030d9a41204e9c25d99e2f2a8.jpg', 'stylist', 3, 3, 3.4, NULL, NULL, NULL, NULL),
(244, 'Phạm Minh Phúc', '09306830276', 'phạmminhphúc3@25zone.vn', '123456', 'TP.HCM', 'https://i.pinimg.com/1200x/2a/27/56/2a2756540442d2c33175cae5e10a2ae6.jpg', 'stylist', 3, 6, 3.5, NULL, NULL, NULL, NULL),
(245, 'Hoàng Minh Phúc', '09445200145', 'hoàngminhphúc3@25zone.vn', '123456', 'TP.HCM', 'https://i.pinimg.com/1200x/3d/b2/4c/3db24cc6b6dd276770b0e99dd5ad2c4f.jpg', 'stylist', 3, 3, 3.1, NULL, NULL, NULL, NULL),
(246, 'Vũ Minh Phúc', '09531595593', 'vũminhphúc3@25zone.vn', '123456', 'TP.HCM', 'https://i.pinimg.com/1200x/63/19/e7/6319e7dfc1e5bd64c1c86eeb0bc56049.jpg', 'stylist', 3, 3, 4.9, NULL, NULL, NULL, NULL),
(247, 'Đỗ Minh Phúc', '09107245037', 'đỗminhphúc3@25zone.vn', '123456', 'TP.HCM', 'https://i.pinimg.com/1200x/80/c3/4b/80c34b3fcc65e98ce71ccb2ae4dccbf6.jpg', 'stylist', 3, 2, 4.2, NULL, NULL, NULL, NULL);
INSERT INTO `users` (`Id_user`, `Name_user`, `Phone`, `Email`, `Pass_word`, `Address`, `Image`, `role`, `Id_store`, `Experience`, `Rating`, `Reset_otp`, `Reset_otp_expired`, `Refresh_token_hash`, `Refresh_token_expired`) VALUES
(248, 'Bùi Minh Phúc', '09726523436', 'bùiminhphúc3@25zone.vn', '123456', 'TP.HCM', 'https://i.pinimg.com/736x/fc/37/7d/fc377d443a1299c42ce0acd7e28d0917.jpg', 'stylist', 3, 7, 3.1, NULL, NULL, NULL, NULL),
(249, 'Ngô Minh Phúc', '09526260379', 'ngôminhphúc3@25zone.vn', '123456', 'TP.HCM', 'https://i.pinimg.com/736x/26/74/c9/2674c9e4680f814c16678867f5b4ca4a.jpg', 'stylist', 3, 2, 3.6, NULL, NULL, NULL, NULL),
(250, 'Phan Minh Phúc', '09184699059', 'phanminhphúc3@25zone.vn', '123456', 'TP.HCM', 'https://i.pinimg.com/736x/b1/ac/24/b1ac241b7e9964fac97cbf7b588c03c3.jpg', 'stylist', 3, 6, 4.0, NULL, NULL, NULL, NULL),
(251, 'Nguyễn Quốc Bảo', '09766895933', 'nguyễnquốcbảo3@25zone.vn', '123456', 'TP.HCM', 'https://i.pinimg.com/736x/ec/f2/fd/ecf2fda305c81a91653ae69b44191732.jpg', 'stylist', 3, 3, 3.2, NULL, NULL, NULL, NULL),
(252, 'Trần Quốc Bảo', '09764801555', 'trầnquốcbảo3@25zone.vn', '123456', 'TP.HCM', 'https://i.pinimg.com/736x/f8/a5/90/f8a590851af62787367ef1ca15f0e70c.jpg', 'stylist', 3, 4, 4.3, NULL, NULL, NULL, NULL),
(253, 'Lê Quốc Bảo', '09177935722', 'lêquốcbảo3@25zone.vn', '123456', 'TP.HCM', 'https://i.pinimg.com/736x/7e/51/4a/7e514ad45e7a4f1ac7c99b867fc7a903.jpg', 'stylist', 3, 6, 3.6, NULL, NULL, NULL, NULL),
(254, 'Phạm Quốc Bảo', '09985217242', 'phạmquốcbảo3@25zone.vn', '123456', 'TP.HCM', 'https://i.pinimg.com/736x/53/da/4a/53da4a98557c4f6418df8ccf357feada.jpg', 'stylist', 3, 1, 3.1, NULL, NULL, NULL, NULL),
(255, 'Hoàng Quốc Bảo', '09413116432', 'hoàngquốcbảo3@25zone.vn', '123456', 'TP.HCM', 'https://i.pinimg.com/736x/2e/2e/f8/2e2ef88034d7657d8f8db61a419f2f56.jpg', 'stylist', 3, 6, 4.1, NULL, NULL, NULL, NULL),
(256, 'Vũ Quốc Bảo', '09348450487', 'vũquốcbảo3@25zone.vn', '123456', 'TP.HCM', 'https://i.pinimg.com/1200x/a2/18/ae/a218aeaaa3dded2a41242d93d3ac0b7c.jpg', 'stylist', 3, 7, 4.1, NULL, NULL, NULL, NULL),
(257, 'Đỗ Quốc Bảo', '09721896743', 'đỗquốcbảo3@25zone.vn', '123456', 'TP.HCM', 'https://i.pinimg.com/736x/f6/02/c0/f602c00efb7af0575260c768d2e6b97e.jpg', 'stylist', 3, 9, 3.1, NULL, NULL, NULL, NULL),
(258, 'Bùi Quốc Bảo', '09843577787', 'bùiquốcbảo3@25zone.vn', '123456', 'TP.HCM', 'https://i.pinimg.com/1200x/84/5f/f6/845ff656f6eeab42d300108db4a829db.jpg', 'stylist', 3, 10, 3.5, NULL, NULL, NULL, NULL),
(259, 'Ngô Quốc Bảo', '09495012450', 'ngôquốcbảo3@25zone.vn', '123456', 'TP.HCM', 'https://i.pinimg.com/1200x/f2/29/a3/f229a3414f9b9ef4b73848353d88dfd7.jpg', 'stylist', 3, 5, 4.6, NULL, NULL, NULL, NULL),
(260, 'Phan Quốc Bảo', '09824397203', 'phanquốcbảo3@25zone.vn', '123456', 'TP.HCM', 'https://i.pinimg.com/736x/8b/0c/40/8b0c40afb9aa16cf63bfd8f418ad0d24.jpg', 'stylist', 3, 6, 3.9, NULL, NULL, NULL, NULL),
(261, 'Nguyễn Thành Long', '09586441646', 'nguyễnthànhlong3@25zone.vn', '123456', 'TP.HCM', 'https://i.pinimg.com/736x/1f/ec/8c/1fec8c17b136088a4cfea91b1e429bec.jpg', 'stylist', 3, 4, 3.2, NULL, NULL, NULL, NULL),
(262, 'Trần Thành Long', '09556608682', 'trầnthànhlong3@25zone.vn', '123456', 'TP.HCM', 'https://i.pinimg.com/736x/3d/d7/3a/3dd73a43053e06f8093743d95e410ba7.jpg', 'stylist', 3, 3, 4.0, NULL, NULL, NULL, NULL),
(263, 'Lê Thành Long', '09994771575', 'lêthànhlong3@25zone.vn', '123456', 'TP.HCM', 'https://i.pinimg.com/736x/31/92/fc/3192fc469e69090b7750783bac2e4ed9.jpg', 'stylist', 3, 4, 3.0, NULL, NULL, NULL, NULL),
(264, 'Phạm Thành Long', '09853293139', 'phạmthànhlong3@25zone.vn', '123456', 'TP.HCM', 'https://i.pinimg.com/736x/db/73/14/db73145b3019b72a8ce9fd6f34edf683.jpg', 'stylist', 3, 2, 3.6, NULL, NULL, NULL, NULL),
(265, 'Hoàng Thành Long', '09204620098', 'hoàngthànhlong3@25zone.vn', '123456', 'TP.HCM', 'https://i.pinimg.com/736x/cd/b1/99/cdb199f2fdd1f4f35c13d9c277b6988a.jpg', 'stylist', 3, 7, 4.4, NULL, NULL, NULL, NULL),
(266, 'Vũ Thành Long', '09730694513', 'vũthànhlong3@25zone.vn', '123456', 'TP.HCM', 'https://i.pinimg.com/736x/e3/09/d0/e309d06d66a35d418f03783d10d45b7c.jpg', 'stylist', 3, 4, 4.6, NULL, NULL, NULL, NULL),
(267, 'Đỗ Thành Long', '09930819931', 'đỗthànhlong3@25zone.vn', '123456', 'TP.HCM', 'https://i.pinimg.com/736x/a1/0b/f0/a10bf013aca790620b27f3a3d6c9f5e9.jpg', 'stylist', 3, 2, 3.2, NULL, NULL, NULL, NULL),
(268, 'Bùi Thành Long', '09936844104', 'bùithànhlong3@25zone.vn', '123456', 'TP.HCM', 'https://i.pinimg.com/736x/29/e9/3d/29e93d0a2d11bdd5be0f6d2e2bfb5dc3.jpg', 'stylist', 3, 4, 3.2, NULL, NULL, NULL, NULL),
(269, 'Ngô Thành Long', '09515391715', 'ngôthànhlong3@25zone.vn', '123456', 'TP.HCM', 'https://i.pinimg.com/736x/0b/75/5c/0b755cded20dcd820916788c51c20034.jpg', 'stylist', 3, 10, 3.7, NULL, NULL, NULL, NULL),
(270, 'Phan Thành Long', '09836547839', 'phanthànhlong3@25zone.vn', '123456', 'TP.HCM', 'https://i.pinimg.com/736x/10/c7/35/10c735b152d0c0b7214c6cba8edb33e1.jpg', 'stylist', 3, 2, 3.1, NULL, NULL, NULL, NULL),
(271, 'Nguyễn Anh Khoa', '09108252349', 'nguyễnanhkhoa3@25zone.vn', '123456', 'TP.HCM', 'https://i.pinimg.com/1200x/c3/03/37/c3033794d6a1d1f9e9f129b8ca771967.jpg', 'stylist', 3, 9, 3.5, NULL, NULL, NULL, NULL),
(272, 'Trần Anh Khoa', '09673397743', 'trầnanhkhoa3@25zone.vn', '123456', 'TP.HCM', 'https://i.pinimg.com/736x/a8/bf/25/a8bf25f678389f15a8061ced8ea31663.jpg', 'stylist', 3, 5, 3.8, NULL, NULL, NULL, NULL),
(273, 'Lê Anh Khoa', '09749007549', 'lêanhkhoa3@25zone.vn', '123456', 'TP.HCM', 'https://i.pinimg.com/736x/1c/3f/23/1c3f2306f4e6fca15feaa468ebada123.jpg', 'stylist', 3, 4, 4.0, NULL, NULL, NULL, NULL),
(274, 'Phạm Anh Khoa', '09538866367', 'phạmanhkhoa3@25zone.vn', '123456', 'TP.HCM', 'https://i.pinimg.com/736x/c5/68/c0/c568c027ff71ad1e554297f12dc005de.jpg', 'stylist', 3, 10, 3.6, NULL, NULL, NULL, NULL),
(275, 'Hoàng Anh Khoa', '09586107007', 'hoànganhkhoa3@25zone.vn', '123456', 'TP.HCM', 'https://i.pinimg.com/736x/10/a8/69/10a869ca226216d68d11a944fc26f4da.jpg', 'stylist', 3, 9, 4.5, NULL, NULL, NULL, NULL),
(276, 'Vũ Anh Khoa', '09139170149', 'vũanhkhoa3@25zone.vn', '123456', 'TP.HCM', 'https://i.pinimg.com/736x/64/25/ad/6425addceba9237dbecda5c9cbeedd57.jpg', 'stylist', 3, 1, 5.0, NULL, NULL, NULL, NULL),
(277, 'Đỗ Anh Khoa', '09908724207', 'đỗanhkhoa3@25zone.vn', '123456', 'TP.HCM', 'https://i.pinimg.com/736x/c5/cf/70/c5cf70c32903c687d01258c8bb66bf36.jpg', 'stylist', 3, 6, 4.7, NULL, NULL, NULL, NULL),
(278, 'Bùi Anh Khoa', '09740344061', 'bùianhkhoa3@25zone.vn', '123456', 'TP.HCM', 'https://i.pinimg.com/736x/76/29/ea/7629ea25cf5f61b289fe22b2a6afe7e5.jpg', 'stylist', 3, 1, 4.9, NULL, NULL, NULL, NULL),
(279, 'Ngô Anh Khoa', '09691972788', 'ngôanhkhoa3@25zone.vn', '123456', 'TP.HCM', 'https://i.pinimg.com/736x/71/6d/bc/716dbcc8170156be710a7b4e98214ea5.jpg', 'stylist', 3, 5, 3.7, NULL, NULL, NULL, NULL),
(280, 'Phan Anh Khoa', '09468534861', 'phananhkhoa3@25zone.vn', '123456', 'TP.HCM', 'https://i.pinimg.com/1200x/86/47/96/864796fabff49a67f3d669f5b8ff886b.jpg', 'stylist', 3, 10, 4.2, NULL, NULL, NULL, NULL),
(281, 'Nguyễn Gia Khánh', '09999525087', 'nguyễngiakhánh3@25zone.vn', '123456', 'TP.HCM', 'https://i.pinimg.com/1200x/08/e7/f2/08e7f25a7a6be001db43a8bcb7984d7e.jpg', 'stylist', 3, 3, 3.7, NULL, NULL, NULL, NULL),
(282, 'Trần Gia Khánh', '09911567280', 'trầngiakhánh3@25zone.vn', '123456', 'TP.HCM', 'https://i.pinimg.com/1200x/b9/ef/33/b9ef33d89641e59ceec73b73d4a64ee4.jpg', 'stylist', 3, 5, 4.4, NULL, NULL, NULL, NULL),
(283, 'Lê Gia Khánh', '09238206533', 'lêgiakhánh3@25zone.vn', '123456', 'TP.HCM', 'https://i.pinimg.com/1200x/d8/fd/05/d8fd05397219a650a42e1a65a2e86c9c.jpg', 'stylist', 3, 7, 4.1, NULL, NULL, NULL, NULL),
(284, 'Phạm Gia Khánh', '09944207530', 'phạmgiakhánh3@25zone.vn', '123456', 'TP.HCM', 'https://i.pinimg.com/736x/67/9e/9f/679e9f67bfa85ec9bf21613f8b7e09c9.jpg', 'stylist', 3, 1, 3.8, NULL, NULL, NULL, NULL),
(285, 'Hoàng Gia Khánh', '09905027524', 'hoànggiakhánh3@25zone.vn', '123456', 'TP.HCM', 'https://i.pinimg.com/1200x/d0/fa/03/d0fa0355f62c9dfc7f64f19efca9870e.jpg', 'stylist', 3, 3, 4.2, NULL, NULL, NULL, NULL),
(286, 'Vũ Gia Khánh', '09308600099', 'vũgiakhánh3@25zone.vn', '123456', 'TP.HCM', 'https://i.pinimg.com/1200x/ab/60/cc/ab60ccd32db97868ec277f72ec47d78d.jpg', 'stylist', 3, 4, 3.2, NULL, NULL, NULL, NULL),
(287, 'Đỗ Gia Khánh', '09452266265', 'đỗgiakhánh3@25zone.vn', '123456', 'TP.HCM', 'https://i.pinimg.com/736x/25/64/c0/2564c0f622ecda415b2221afc28ef08d.jpg', 'stylist', 3, 7, 3.4, NULL, NULL, NULL, NULL),
(288, 'Bùi Gia Khánh', '09149100006', 'bùigiakhánh3@25zone.vn', '123456', 'TP.HCM', 'https://i.pinimg.com/736x/25/eb/64/25eb64baaabf00217c4a0d48b1c1b5ff.jpg', 'stylist', 3, 7, 4.9, NULL, NULL, NULL, NULL),
(289, 'Ngô Gia Khánh', '09816812817', 'ngôgiakhánh3@25zone.vn', '123456', 'TP.HCM', 'https://i.pinimg.com/736x/d0/5d/b4/d05db4cb53a205f0474eb50c00909cb1.jpg', 'stylist', 3, 2, 4.1, NULL, NULL, NULL, NULL),
(290, 'Phan Gia Khánh', '09319326678', 'phangiakhánh3@25zone.vn', '123456', 'TP.HCM', 'https://i.pinimg.com/1200x/d7/ef/c9/d7efc92c34244bfea22f177d3018f7c3.jpg', 'stylist', 3, 6, 4.8, NULL, NULL, NULL, NULL),
(291, 'Nguyễn Tuấn Đạt', '09992189664', 'nguyễntuấnđạt3@25zone.vn', '123456', 'TP.HCM', 'https://i.pinimg.com/1200x/ca/ed/2a/caed2aa2cbf26a752a565edeccaef001.jpg', 'stylist', 3, 3, 3.1, NULL, NULL, NULL, NULL),
(292, 'Trần Tuấn Đạt', '09753354348', 'trầntuấnđạt3@25zone.vn', '123456', 'TP.HCM', 'https://i.pinimg.com/1200x/74/0a/b5/740ab5b761abda7ea4920ea0de610f1d.jpg', 'stylist', 3, 5, 4.8, NULL, NULL, NULL, NULL),
(293, 'Lê Tuấn Đạt', '09379228407', 'lêtuấnđạt3@25zone.vn', '123456', 'TP.HCM', 'https://i.pinimg.com/736x/d7/3e/41/d73e418bc60c475c2a4fdfe2549edc9a.jpg', 'stylist', 3, 9, 3.3, NULL, NULL, NULL, NULL),
(294, 'Phạm Tuấn Đạt', '09297706616', 'phạmtuấnđạt3@25zone.vn', '123456', 'TP.HCM', 'https://i.pinimg.com/736x/55/87/71/558771c436f429075da88dbe6dca3a4f.jpg', 'stylist', 3, 8, 4.7, NULL, NULL, NULL, NULL),
(295, 'Hoàng Tuấn Đạt', '09277363759', 'hoàngtuấnđạt3@25zone.vn', '123456', 'TP.HCM', 'https://i.pinimg.com/736x/fc/fa/12/fcfa120f3bbb520e63be7f9316345097.jpg', 'stylist', 3, 4, 3.8, NULL, NULL, NULL, NULL),
(296, 'Vũ Tuấn Đạt', '09851023538', 'vũtuấnđạt3@25zone.vn', '123456', 'TP.HCM', 'https://i.pinimg.com/736x/15/8e/15/158e1568752be459164520448f84d111.jpg', 'stylist', 3, 10, 3.5, NULL, NULL, NULL, NULL),
(297, 'Đỗ Tuấn Đạt', '09493063049', 'đỗtuấnđạt3@25zone.vn', '123456', 'TP.HCM', 'https://i.pinimg.com/736x/07/35/79/073579dc576f6247cf0896e310b55024.jpg', 'stylist', 3, 5, 4.5, NULL, NULL, NULL, NULL),
(298, 'Bùi Tuấn Đạt', '09467409867', 'bùituấnđạt3@25zone.vn', '123456', 'TP.HCM', 'https://i.pinimg.com/1200x/ea/1d/bb/ea1dbb4be8a529a70571a2bffc6193aa.jpg', 'stylist', 3, 9, 3.2, NULL, NULL, NULL, NULL),
(299, 'Ngô Tuấn Đạt', '09880088529', 'ngôtuấnđạt3@25zone.vn', '123456', 'TP.HCM', 'https://i.pinimg.com/1200x/57/62/5f/57625f1ee1372b96a927230f97dde36e.jpg', 'stylist', 3, 1, 4.4, NULL, NULL, NULL, NULL),
(300, 'Phan Tuấn Đạt', '09387017470', 'phantuấnđạt3@25zone.vn', '123456', 'TP.HCM', 'https://i.pinimg.com/1200x/4e/dd/fd/4eddfd162b087797e5204f74093b3570.jpg', 'stylist', 3, 5, 4.0, NULL, NULL, NULL, NULL),
(301, 'Nguyễn Hải Nam', '09199008745', 'nguyễnhảinam3@25zone.vn', '123456', 'TP.HCM', 'https://i.pinimg.com/1200x/93/14/eb/9314eb0b678795c354f4790cd35dad05.jpg', 'stylist', 3, 10, 4.3, NULL, NULL, NULL, NULL),
(302, 'Trần Hải Nam', '09271229353', 'trầnhảinam3@25zone.vn', '123456', 'TP.HCM', 'https://i.pinimg.com/736x/de/47/95/de47954723552a6a44ca01e3152182bd.jpg', 'stylist', 3, 1, 4.4, NULL, NULL, NULL, NULL),
(303, 'Lê Hải Nam', '09325113613', 'lêhảinam3@25zone.vn', '123456', 'TP.HCM', 'https://i.pinimg.com/736x/48/ae/55/48ae550652f93e3f6014b28f3da4c280.jpg', 'stylist', 3, 3, 3.6, NULL, NULL, NULL, NULL),
(304, 'Phạm Hải Nam', '09885897971', 'phạmhảinam3@25zone.vn', '123456', 'TP.HCM', 'https://i.pinimg.com/736x/35/ea/2d/35ea2d40dceed616066ca1ea2372747e.jpg', 'stylist', 3, 5, 4.4, NULL, NULL, NULL, NULL),
(305, 'Hoàng Hải Nam', '09193771680', 'hoànghảinam3@25zone.vn', '123456', 'TP.HCM', 'https://i.pinimg.com/736x/4c/6e/99/4c6e995cf14aba045f727c2031fe6916.jpg', 'stylist', 3, 5, 4.6, NULL, NULL, NULL, NULL),
(306, 'Vũ Hải Nam', '09782490656', 'vũhảinam3@25zone.vn', '123456', 'TP.HCM', 'https://i.pinimg.com/736x/f9/0a/a1/f90aa18972673194cf63a11a0bfa2138.jpg', 'stylist', 3, 4, 4.2, NULL, NULL, NULL, NULL),
(307, 'Đỗ Hải Nam', '09867418668', 'đỗhảinam3@25zone.vn', '123456', 'TP.HCM', 'https://i.pinimg.com/736x/54/1d/3b/541d3b20f9197a2366a0ed719d7150a0.jpg', 'stylist', 3, 5, 4.7, NULL, NULL, NULL, NULL),
(308, 'Bùi Hải Nam', '09766247194', 'bùihảinam3@25zone.vn', '123456', 'TP.HCM', 'https://i.pinimg.com/1200x/8c/49/9f/8c499f37397e79b5066d9bc6ebd80e56.jpg', 'stylist', 3, 2, 4.5, NULL, NULL, NULL, NULL),
(309, 'Ngô Hải Nam', '09279473034', 'ngôhảinam3@25zone.vn', '123456', 'TP.HCM', 'https://i.pinimg.com/736x/63/38/9e/63389ef90220a81e2d4c87bf693c4175.jpg', 'stylist', 3, 8, 3.1, NULL, NULL, NULL, NULL),
(310, 'Phan Hải Nam', '09969169894', 'phanhảinam3@25zone.vn', '123456', 'TP.HCM', 'https://i.pinimg.com/736x/39/7c/bc/397cbce994ca729f95de01ce6b37edd2.jpg', 'stylist', 3, 8, 4.6, NULL, NULL, NULL, NULL),
(311, 'Nguyễn Minh Sơn', '09887821175', 'nguyễnminhsơn3@25zone.vn', '123456', 'TP.HCM', 'https://i.pinimg.com/736x/9c/08/c9/9c08c9b277455d4fd7190b747a5d2761.jpg', 'stylist', 3, 10, 4.9, NULL, NULL, NULL, NULL),
(312, 'Trần Minh Sơn', '09958108329', 'trầnminhsơn3@25zone.vn', '123456', 'TP.HCM', 'https://i.pinimg.com/736x/c1/e8/c3/c1e8c3447d8a5c59423e607376b066c2.jpg', 'stylist', 3, 10, 4.8, NULL, NULL, NULL, NULL),
(313, 'Lê Minh Sơn', '09677496154', 'lêminhsơn3@25zone.vn', '123456', 'TP.HCM', 'https://i.pinimg.com/736x/42/cc/27/42cc279bf5ee5df75adb097d1ea6fd24.jpg', 'stylist', 3, 6, 4.2, NULL, NULL, NULL, NULL),
(314, 'Phạm Minh Sơn', '09630768893', 'phạmminhsơn3@25zone.vn', '123456', 'TP.HCM', 'https://i.pinimg.com/736x/dd/e4/0e/dde40ebb4cb62a20a0eaad2b0852572e.jpg', 'stylist', 3, 1, 4.2, NULL, NULL, NULL, NULL),
(315, 'Hoàng Minh Sơn', '09869116818', 'hoàngminhsơn3@25zone.vn', '123456', 'TP.HCM', 'https://i.pinimg.com/736x/7e/de/4a/7ede4abc26529432d38fce0caeb4c2ca.jpg', 'stylist', 3, 5, 4.1, NULL, NULL, NULL, NULL),
(316, 'Vũ Minh Sơn', '09498586810', 'vũminhsơn3@25zone.vn', '123456', 'TP.HCM', 'https://i.pinimg.com/736x/0d/26/eb/0d26eb6c587bba7d37c8c52db056d096.jpg', 'stylist', 3, 6, 4.3, NULL, NULL, NULL, NULL),
(317, 'Đỗ Minh Sơn', '09420792213', 'đỗminhsơn3@25zone.vn', '123456', 'TP.HCM', 'https://i.pinimg.com/736x/73/a1/6d/73a16dff95f2293da5817ca03e219861.jpg', 'stylist', 3, 10, 3.9, NULL, NULL, NULL, NULL),
(318, 'Bùi Minh Sơn', '09601534622', 'bùiminhsơn3@25zone.vn', '123456', 'TP.HCM', 'https://i.pinimg.com/1200x/18/f2/80/18f280f463f23cf1792cb52e485bbba8.jpg', 'stylist', 3, 5, 3.9, NULL, NULL, NULL, NULL),
(319, 'Ngô Minh Sơn', '09961381541', 'ngôminhsơn3@25zone.vn', '123456', 'TP.HCM', 'https://i.pinimg.com/736x/f5/72/f0/f572f0abe0bafe140e159810acee7e9a.jpg', 'stylist', 3, 5, 3.7, NULL, NULL, NULL, NULL),
(320, 'Phan Minh Sơn', '09569089966', 'phanminhsơn3@25zone.vn', '123456', 'TP.HCM', 'https://i.pinimg.com/736x/8d/c1/e6/8dc1e620f3be36856ffb634757ab32ba.jpg', 'stylist', 3, 5, 4.7, NULL, NULL, NULL, NULL),
(321, 'Nguyễn Hoàng Huy', '09869897147', 'nguyễnhoànghuy4@25zone.vn', '123456', 'TP.HCM', 'https://i.pinimg.com/1200x/c8/30/25/c830259a348f77a966562e5e6096d0c7.jpg', 'stylist', 4, 7, 4.8, NULL, NULL, NULL, NULL),
(322, 'Trần Hoàng Huy', '09426344195', 'trầnhoànghuy4@25zone.vn', '123456', 'TP.HCM', 'https://i.pinimg.com/1200x/19/9e/e8/199ee825c9c49a7d109d1e9ac6b58160.jpg', 'stylist', 4, 2, 4.3, NULL, NULL, NULL, NULL),
(323, 'Lê Hoàng Huy', '09920314111', 'lêhoànghuy4@25zone.vn', '123456', 'TP.HCM', 'https://i.pinimg.com/1200x/a5/60/47/a56047cefe7fd69a533d391b265ed773.jpg', 'stylist', 4, 6, 4.9, NULL, NULL, NULL, NULL),
(324, 'Phạm Hoàng Huy', '09213837133', 'phạmhoànghuy4@25zone.vn', '123456', 'TP.HCM', 'https://i.pinimg.com/736x/84/c1/44/84c1449c5654914fa4d61ce909d93c94.jpg', 'stylist', 4, 8, 4.2, NULL, NULL, NULL, NULL),
(325, 'Hoàng Hoàng Huy', '09558491066', 'hoànghoànghuy4@25zone.vn', '123456', 'TP.HCM', 'https://i.pinimg.com/1200x/8f/f0/62/8ff062cf58f52592b3950462cf28bc6e.jpg', 'stylist', 4, 9, 4.1, NULL, NULL, NULL, NULL),
(326, 'Vũ Hoàng Huy', '09405684199', 'vũhoànghuy4@25zone.vn', '123456', 'TP.HCM', 'https://i.pinimg.com/1200x/78/90/6a/78906a7896ba2701bfe8e603c1f86912.jpg', 'stylist', 4, 1, 3.2, NULL, NULL, NULL, NULL),
(327, 'Đỗ Hoàng Huy', '09475478579', 'đỗhoànghuy4@25zone.vn', '123456', 'TP.HCM', 'https://i.pinimg.com/1200x/39/11/25/3911252e821949970c2d993e6da158fd.jpg', 'stylist', 4, 8, 4.4, NULL, NULL, NULL, NULL),
(328, 'Bùi Hoàng Huy', '09284814426', 'bùihoànghuy4@25zone.vn', '123456', 'TP.HCM', 'https://i.pinimg.com/736x/d4/f8/db/d4f8db3613ca62e19a25e91597fd6a73.jpg', 'stylist', 4, 9, 4.5, NULL, NULL, NULL, NULL),
(329, 'Ngô Hoàng Huy', '09247233898', 'ngôhoànghuy4@25zone.vn', '123456', 'TP.HCM', 'https://i.pinimg.com/736x/24/0f/f9/240ff9c3f6b8f6c55afab7a7ca1903ff.jpg', 'stylist', 4, 6, 3.5, NULL, NULL, NULL, NULL),
(330, 'Phan Hoàng Huy', '09588723814', 'phanhoànghuy4@25zone.vn', '123456', 'TP.HCM', 'https://i.pinimg.com/1200x/80/04/19/800419c331a2b3c2fbc085ec41b8f018.jpg', 'stylist', 4, 1, 3.8, NULL, NULL, NULL, NULL),
(331, 'Nguyễn Đức Duy', '09122591356', 'nguyễnđứcduy4@25zone.vn', '123456', 'TP.HCM', 'https://i.pinimg.com/1200x/d1/6c/76/d16c7604341eef56b2c18d71e09517ff.jpg', 'stylist', 4, 9, 3.8, NULL, NULL, NULL, NULL),
(332, 'Trần Đức Duy', '09411766951', 'trầnđứcduy4@25zone.vn', '123456', 'TP.HCM', 'https://i.pinimg.com/1200x/2c/2b/04/2c2b04269fd598710819236858e5398a.jpg', 'stylist', 4, 6, 4.0, NULL, NULL, NULL, NULL),
(333, 'Lê Đức Duy', '09131390938', 'lêđứcduy4@25zone.vn', '123456', 'TP.HCM', 'https://i.pinimg.com/736x/01/f6/56/01f65682532a6ef2f06b0a0beeccc8cd.jpg', 'stylist', 4, 7, 3.1, NULL, NULL, NULL, NULL),
(334, 'Phạm Đức Duy', '09493568868', 'phạmđứcduy4@25zone.vn', '123456', 'TP.HCM', 'https://i.pinimg.com/1200x/4c/e7/b5/4ce7b5f6783f0fe6a870751bf6c6a305.jpg', 'stylist', 4, 10, 4.2, NULL, NULL, NULL, NULL),
(335, 'Hoàng Đức Duy', '09137955613', 'hoàngđứcduy4@25zone.vn', '123456', 'TP.HCM', 'https://i.pinimg.com/736x/5a/ba/44/5aba4461ac1c42791046be61592980e8.jpg', 'stylist', 4, 5, 4.9, NULL, NULL, NULL, NULL),
(336, 'Vũ Đức Duy', '09610091071', 'vũđứcduy4@25zone.vn', '123456', 'TP.HCM', 'https://i.pinimg.com/1200x/9f/27/df/9f27df65894ce38736cd89bb2aa7afe5.jpg', 'stylist', 4, 10, 3.0, NULL, NULL, NULL, NULL),
(337, 'Đỗ Đức Duy', '09282485638', 'đỗđứcduy4@25zone.vn', '123456', 'TP.HCM', 'https://i.pinimg.com/736x/f5/93/b5/f593b524648c11f96e68254cc18fb683.jpg', 'stylist', 4, 10, 3.8, NULL, NULL, NULL, NULL),
(338, 'Bùi Đức Duy', '09926393580', 'bùiđứcduy4@25zone.vn', '123456', 'TP.HCM', 'https://i.pinimg.com/736x/fd/bf/87/fdbf87bd412dd3dd888da231279decf8.jpg', 'stylist', 4, 5, 3.9, NULL, NULL, NULL, NULL),
(339, 'Ngô Đức Duy', '09984375698', 'ngôđứcduy4@25zone.vn', '123456', 'TP.HCM', 'https://i.pinimg.com/736x/84/51/18/84511800a9372ecb58db44f5cf189c3d.jpg', 'stylist', 4, 6, 4.4, NULL, NULL, NULL, NULL),
(340, 'Phan Đức Duy', '09837430672', 'phanđứcduy4@25zone.vn', '123456', 'TP.HCM', 'https://i.pinimg.com/736x/a1/3b/ea/a13bea23fb1f83989c1ac68a6217c1ff.jpg', 'stylist', 4, 1, 4.7, NULL, NULL, NULL, NULL),
(341, 'Nguyễn Minh Phúc', '09116311449', 'nguyễnminhphúc4@25zone.vn', '123456', 'TP.HCM', 'https://i.pinimg.com/736x/11/49/9f/11499f02e011217677ac3a68a650a737.jpg', 'stylist', 4, 6, 4.6, NULL, NULL, NULL, NULL),
(342, 'Trần Minh Phúc', '09394289194', 'trầnminhphúc4@25zone.vn', '123456', 'TP.HCM', 'https://i.pinimg.com/736x/dd/93/6f/dd936f7ea0026eb6187a82da423e7cf8.jpg', 'stylist', 4, 3, 3.1, NULL, NULL, NULL, NULL),
(343, 'Lê Minh Phúc', '09702727889', 'lêminhphúc4@25zone.vn', '123456', 'TP.HCM', 'https://i.pinimg.com/736x/b8/31/7c/b8317cbcd3e937152b10fa82913acd88.jpg', 'stylist', 4, 2, 4.7, NULL, NULL, NULL, NULL),
(344, 'Phạm Minh Phúc', '09772424409', 'phạmminhphúc4@25zone.vn', '123456', 'TP.HCM', 'https://i.pinimg.com/736x/1c/9e/e7/1c9ee7a5dd2d498531c718662fad8254.jpg', 'stylist', 4, 2, 4.3, NULL, NULL, NULL, NULL),
(345, 'Hoàng Minh Phúc', '09720301217', 'hoàngminhphúc4@25zone.vn', '123456', 'TP.HCM', 'https://i.pinimg.com/736x/0b/86/94/0b8694f14fbf3330a66bb1163cda6798.jpg', 'stylist', 4, 6, 4.0, NULL, NULL, NULL, NULL),
(346, 'Vũ Minh Phúc', '09968639835', 'vũminhphúc4@25zone.vn', '123456', 'TP.HCM', 'https://i.pinimg.com/736x/4b/e2/f8/4be2f857344b93c4c2dfab25eae3463b.jpg', 'stylist', 4, 4, 4.4, NULL, NULL, NULL, NULL),
(347, 'Đỗ Minh Phúc', '09643055484', 'đỗminhphúc4@25zone.vn', '123456', 'TP.HCM', 'https://i.pinimg.com/736x/5b/25/e4/5b25e46ea1fb9cd7f1a9fd7e45d8a61c.jpg', 'stylist', 4, 9, 4.1, NULL, NULL, NULL, NULL),
(348, 'Bùi Minh Phúc', '09291164618', 'bùiminhphúc4@25zone.vn', '123456', 'TP.HCM', 'https://i.pinimg.com/736x/85/dd/1f/85dd1f51e761384b3f90b7d7488f74ce.jpg', 'stylist', 4, 4, 3.3, NULL, NULL, NULL, NULL),
(349, 'Ngô Minh Phúc', '09730672812', 'ngôminhphúc4@25zone.vn', '123456', 'TP.HCM', 'https://i.pinimg.com/736x/78/ae/2f/78ae2f925d658ca173bc17ef7784a251.jpg', 'stylist', 4, 1, 3.2, NULL, NULL, NULL, NULL),
(350, 'Phan Minh Phúc', '09392381766', 'phanminhphúc4@25zone.vn', '123456', 'TP.HCM', 'https://i.pinimg.com/1200x/bb/2d/17/bb2d17d4a937ad4e2f0a239973cdf997.jpg', 'stylist', 4, 4, 4.7, NULL, NULL, NULL, NULL),
(351, 'Nguyễn Quốc Bảo', '09162376852', 'nguyễnquốcbảo4@25zone.vn', '123456', 'TP.HCM', 'https://i.pinimg.com/1200x/4c/1c/26/4c1c268463ff16596cefccea2c447ac7.jpg', 'stylist', 4, 9, 3.1, NULL, NULL, NULL, NULL),
(352, 'Trần Quốc Bảo', '09795841949', 'trầnquốcbảo4@25zone.vn', '123456', 'TP.HCM', 'https://i.pinimg.com/736x/85/da/d0/85dad03c87997f54c5c7e4d5ac2b8422.jpg', 'stylist', 4, 7, 5.0, NULL, NULL, NULL, NULL),
(353, 'Lê Quốc Bảo', '09983182471', 'lêquốcbảo4@25zone.vn', '123456', 'TP.HCM', 'https://i.pinimg.com/1200x/82/7c/6d/827c6dc63f38efb7e0e824d319e093a5.jpg', 'stylist', 4, 10, 4.4, NULL, NULL, NULL, NULL),
(354, 'Phạm Quốc Bảo', '09666866555', 'phạmquốcbảo4@25zone.vn', '123456', 'TP.HCM', 'https://i.pinimg.com/736x/09/3b/17/093b170aabc3cb2eae238d60aaa23466.jpg', 'stylist', 4, 2, 4.3, NULL, NULL, NULL, NULL),
(355, 'Hoàng Quốc Bảo', '09903399191', 'hoàngquốcbảo4@25zone.vn', '123456', 'TP.HCM', 'https://i.pinimg.com/1200x/57/f4/a5/57f4a588690771ab612c4ef3a20c4082.jpg', 'stylist', 4, 6, 3.0, NULL, NULL, NULL, NULL),
(356, 'Vũ Quốc Bảo', '09466539775', 'vũquốcbảo4@25zone.vn', '123456', 'TP.HCM', 'https://i.pinimg.com/736x/0e/e5/e2/0ee5e2e9b69a488f339dbc3e8e46c3c2.jpg', 'stylist', 4, 1, 4.8, NULL, NULL, NULL, NULL),
(357, 'Đỗ Quốc Bảo', '09531405342', 'đỗquốcbảo4@25zone.vn', '123456', 'TP.HCM', 'https://i.pinimg.com/736x/1b/7f/24/1b7f2467ac6a8fcbbdf097e886d5cef0.jpg', 'stylist', 4, 7, 4.7, NULL, NULL, NULL, NULL),
(358, 'Bùi Quốc Bảo', '09415854949', 'bùiquốcbảo4@25zone.vn', '123456', 'TP.HCM', 'https://i.pinimg.com/1200x/ec/60/8b/ec608b5250989564beb837c9ca6e0481.jpg', 'stylist', 4, 2, 4.4, NULL, NULL, NULL, NULL),
(359, 'Ngô Quốc Bảo', '09220453159', 'ngôquốcbảo4@25zone.vn', '123456', 'TP.HCM', 'https://i.pinimg.com/736x/56/7a/65/567a6518fd9a91627373d9714c9f3e54.jpg', 'stylist', 4, 6, 3.3, NULL, NULL, NULL, NULL),
(360, 'Phan Quốc Bảo', '09308170568', 'phanquốcbảo4@25zone.vn', '123456', 'TP.HCM', 'https://i.pinimg.com/736x/46/1d/2d/461d2db641336fc4238cb1a4af4ca347.jpg', 'stylist', 4, 7, 4.6, NULL, NULL, NULL, NULL),
(361, 'Nguyễn Thành Long', '09901411611', 'nguyễnthànhlong4@25zone.vn', '123456', 'TP.HCM', 'https://i.pinimg.com/736x/4a/7f/8a/4a7f8a0d33e5152584d0de003523b5c3.jpg', 'stylist', 4, 1, 4.3, NULL, NULL, NULL, NULL),
(362, 'Trần Thành Long', '09992325064', 'trầnthànhlong4@25zone.vn', '123456', 'TP.HCM', 'https://i.pinimg.com/736x/e7/b8/f6/e7b8f6ba66759a09306c2a19f58628c8.jpg', 'stylist', 4, 1, 3.6, NULL, NULL, NULL, NULL),
(363, 'Lê Thành Long', '09347893181', 'lêthànhlong4@25zone.vn', '123456', 'TP.HCM', 'https://i.pinimg.com/1200x/a2/b2/10/a2b210fdf220072a4c3f415bcff04a38.jpg', 'stylist', 4, 6, 4.5, NULL, NULL, NULL, NULL),
(364, 'Phạm Thành Long', '09338679236', 'phạmthànhlong4@25zone.vn', '123456', 'TP.HCM', 'https://i.pinimg.com/736x/38/1f/5e/381f5e8286b78d9265cda6cc2b694c15.jpg', 'stylist', 4, 1, 3.8, NULL, NULL, NULL, NULL);

-- --------------------------------------------------------

--
-- Cấu trúc bảng cho bảng `vouchers`
--

CREATE TABLE `vouchers` (
  `Id_voucher` int NOT NULL,
  `Name` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NOT NULL,
  `Voucher_Coder` varchar(10) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NOT NULL,
  `Status` int NOT NULL DEFAULT '0',
  `min_order_value` double(10,0) NOT NULL,
  `Discount_value` double(10,0) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Đang đổ dữ liệu cho bảng `vouchers`
--

INSERT INTO `vouchers` (`Id_voucher`, `Name`, `Voucher_Coder`, `Status`, `min_order_value`, `Discount_value`) VALUES
(1, 'Giảm 50K cho đơn từ 300K', 'SALE50', 1, 300000, 50000),
(2, 'Giảm 100K cho đơn từ 600K', 'SALE100', 1, 600000, 100000),
(3, 'Giảm 200K cho đơn từ 1 triệu', 'SALE200', 1, 1000000, 200000);

-- --------------------------------------------------------

--
-- Cấu trúc bảng cho bảng `work_shifts`
--

CREATE TABLE `work_shifts` (
  `Id_work_shifts` int NOT NULL,
  `Shift_date` date NOT NULL,
  `Start_time` time NOT NULL,
  `End_time` time NOT NULL,
  `Id_user` int NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Đang đổ dữ liệu cho bảng `work_shifts`
--

INSERT INTO `work_shifts` (`Id_work_shifts`, `Shift_date`, `Start_time`, `End_time`, `Id_user`) VALUES
(1, '2026-02-25', '09:00:00', '17:00:00', 5),
(2, '2026-02-26', '10:00:00', '18:00:00', 5),
(3, '2026-02-25', '09:30:00', '17:30:00', 8),
(4, '2026-02-26', '12:00:00', '20:00:00', 8),
(5, '2026-02-25', '09:00:00', '17:00:00', 4),
(6, '2026-02-26', '08:30:00', '16:30:00', 7),
(7, '2026-03-01', '09:00:00', '17:00:00', 1),
(8, '2026-03-02', '09:00:00', '17:00:00', 1),
(9, '2026-03-03', '09:00:00', '17:00:00', 1),
(10, '2026-03-04', '09:00:00', '17:00:00', 1),
(11, '2026-03-05', '09:00:00', '17:00:00', 1),
(12, '2026-03-06', '09:00:00', '17:00:00', 1),
(13, '2026-03-07', '09:00:00', '17:00:00', 1),
(14, '2026-03-08', '09:00:00', '17:00:00', 1),
(15, '2026-03-09', '09:00:00', '17:00:00', 1),
(16, '2026-03-10', '09:00:00', '17:00:00', 1),
(17, '2026-03-01', '09:00:00', '17:00:00', 2),
(18, '2026-03-02', '09:00:00', '17:00:00', 2),
(19, '2026-03-03', '09:00:00', '17:00:00', 2),
(20, '2026-03-04', '09:00:00', '17:00:00', 2),
(21, '2026-03-05', '09:00:00', '17:00:00', 2),
(22, '2026-03-06', '09:00:00', '17:00:00', 2),
(23, '2026-03-07', '09:00:00', '17:00:00', 2),
(24, '2026-03-08', '09:00:00', '17:00:00', 2),
(25, '2026-03-09', '09:00:00', '17:00:00', 2),
(26, '2026-03-10', '09:00:00', '17:00:00', 2),
(27, '2026-03-01', '09:00:00', '17:00:00', 3),
(28, '2026-03-02', '09:00:00', '17:00:00', 3),
(29, '2026-03-03', '09:00:00', '17:00:00', 3),
(30, '2026-03-04', '09:00:00', '17:00:00', 3),
(31, '2026-03-05', '09:00:00', '17:00:00', 3),
(32, '2026-03-06', '09:00:00', '17:00:00', 3),
(33, '2026-03-07', '09:00:00', '17:00:00', 3),
(34, '2026-03-08', '09:00:00', '17:00:00', 3),
(35, '2026-03-09', '09:00:00', '17:00:00', 3),
(36, '2026-03-10', '09:00:00', '17:00:00', 3),
(37, '2026-03-01', '09:00:00', '17:00:00', 4),
(38, '2026-03-02', '09:00:00', '17:00:00', 4),
(39, '2026-03-03', '09:00:00', '17:00:00', 4),
(40, '2026-03-04', '09:00:00', '17:00:00', 4),
(41, '2026-03-05', '09:00:00', '17:00:00', 4),
(42, '2026-03-06', '09:00:00', '17:00:00', 4),
(43, '2026-03-07', '09:00:00', '17:00:00', 4),
(44, '2026-03-08', '09:00:00', '17:00:00', 4),
(45, '2026-03-09', '09:00:00', '17:00:00', 4),
(46, '2026-03-10', '09:00:00', '17:00:00', 4),
(47, '2026-04-01', '19:00:00', '00:00:00', 364),
(48, '2026-04-06', '08:00:00', '00:00:00', 364),
(49, '2026-04-07', '08:00:00', '00:00:00', 364),
(50, '2026-04-08', '08:00:00', '00:00:00', 364),
(51, '2026-04-09', '08:00:00', '00:00:00', 364),
(52, '2026-04-10', '08:00:00', '00:00:00', 364),
(53, '2026-04-11', '08:00:00', '00:00:00', 364),
(54, '2026-04-12', '08:00:00', '00:00:00', 364),
(55, '2026-04-06', '08:00:00', '22:00:00', 363),
(56, '2026-04-07', '08:00:00', '22:00:00', 363),
(57, '2026-04-08', '08:00:00', '22:00:00', 363),
(58, '2026-04-09', '08:00:00', '22:00:00', 363),
(59, '2026-04-10', '08:00:00', '22:00:00', 363),
(60, '2026-04-11', '08:00:00', '22:00:00', 363),
(61, '2026-04-12', '08:00:00', '22:00:00', 363);

-- --------------------------------------------------------

--
-- Cấu trúc bảng cho bảng `work_shifts_hours`
--

CREATE TABLE `work_shifts_hours` (
  `Id_work_shifts_hour` int NOT NULL,
  `Status` int NOT NULL DEFAULT '1',
  `Hours` time NOT NULL,
  `Id_work_shifts` int NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Đang đổ dữ liệu cho bảng `work_shifts_hours`
--

INSERT INTO `work_shifts_hours` (`Id_work_shifts_hour`, `Status`, `Hours`, `Id_work_shifts`) VALUES
(1, 1, '09:00:00', 1),
(2, 1, '09:30:00', 1),
(3, 1, '10:00:00', 1),
(4, 1, '10:30:00', 1),
(5, 1, '11:00:00', 1),
(6, 1, '11:30:00', 1),
(7, 1, '12:00:00', 1),
(8, 1, '12:30:00', 1),
(9, 1, '13:00:00', 1),
(10, 1, '13:30:00', 1),
(11, 1, '14:00:00', 1),
(12, 1, '14:30:00', 1),
(13, 1, '15:00:00', 1),
(14, 1, '15:30:00', 1),
(15, 1, '16:00:00', 1),
(16, 1, '16:30:00', 1),
(17, 1, '10:00:00', 2),
(18, 1, '10:30:00', 2),
(19, 1, '11:00:00', 2),
(20, 1, '11:30:00', 2),
(21, 1, '12:00:00', 2),
(22, 1, '12:30:00', 2),
(23, 1, '13:00:00', 2),
(24, 1, '13:30:00', 2),
(25, 1, '14:00:00', 2),
(26, 1, '14:30:00', 2),
(27, 1, '15:00:00', 2),
(28, 1, '15:30:00', 2),
(29, 1, '16:00:00', 2),
(30, 1, '16:30:00', 2),
(31, 1, '17:00:00', 2),
(32, 1, '17:30:00', 2),
(33, 1, '09:30:00', 3),
(34, 1, '10:00:00', 3),
(35, 1, '10:30:00', 3),
(36, 1, '11:00:00', 3),
(37, 1, '11:30:00', 3),
(38, 1, '12:00:00', 3),
(39, 1, '12:30:00', 3),
(40, 1, '13:00:00', 3),
(41, 1, '13:30:00', 3),
(42, 1, '14:00:00', 3),
(43, 1, '14:30:00', 3),
(44, 1, '15:00:00', 3),
(45, 1, '15:30:00', 3),
(46, 1, '16:00:00', 3),
(47, 1, '16:30:00', 3),
(48, 1, '17:00:00', 3),
(49, 1, '12:00:00', 4),
(50, 1, '12:30:00', 4),
(51, 1, '13:00:00', 4),
(52, 1, '13:30:00', 4),
(53, 1, '14:00:00', 4),
(54, 1, '14:30:00', 4),
(55, 1, '15:00:00', 4),
(56, 1, '15:30:00', 4),
(57, 1, '16:00:00', 4),
(58, 1, '16:30:00', 4),
(59, 1, '17:00:00', 4),
(60, 1, '17:30:00', 4),
(61, 1, '18:00:00', 4),
(62, 1, '18:30:00', 4),
(63, 1, '19:00:00', 4),
(64, 1, '19:30:00', 4),
(65, 1, '09:00:00', 5),
(66, 1, '09:30:00', 5),
(67, 1, '10:00:00', 5),
(68, 1, '10:30:00', 5),
(69, 1, '11:00:00', 5),
(70, 1, '11:30:00', 5),
(71, 1, '12:00:00', 5),
(72, 1, '12:30:00', 5),
(73, 1, '13:00:00', 5),
(74, 1, '13:30:00', 5),
(75, 1, '14:00:00', 5),
(76, 1, '14:30:00', 5),
(77, 1, '15:00:00', 5),
(78, 1, '15:30:00', 5),
(79, 1, '16:00:00', 5),
(80, 1, '16:30:00', 5),
(81, 1, '08:30:00', 6),
(82, 1, '09:00:00', 6),
(83, 1, '09:30:00', 6),
(84, 1, '10:00:00', 6),
(85, 1, '10:30:00', 6),
(86, 1, '11:00:00', 6),
(87, 1, '11:30:00', 6),
(88, 1, '12:00:00', 6),
(89, 1, '12:30:00', 6),
(90, 1, '13:00:00', 6),
(91, 1, '13:30:00', 6),
(92, 1, '14:00:00', 6),
(93, 1, '14:30:00', 6),
(94, 1, '15:00:00', 6),
(95, 1, '15:30:00', 6),
(96, 1, '16:00:00', 6),
(97, 1, '09:00:00', 7),
(98, 1, '09:30:00', 7),
(99, 1, '10:00:00', 7),
(100, 1, '10:30:00', 7),
(101, 1, '11:00:00', 7),
(102, 1, '11:30:00', 7),
(103, 1, '12:00:00', 7),
(104, 1, '12:30:00', 7),
(105, 1, '13:00:00', 7),
(106, 1, '13:30:00', 7),
(107, 1, '14:00:00', 7),
(108, 1, '14:30:00', 7),
(109, 1, '15:00:00', 7),
(110, 1, '15:30:00', 7),
(111, 1, '16:00:00', 7),
(112, 1, '16:30:00', 7),
(113, 1, '09:00:00', 8),
(114, 1, '09:30:00', 8),
(115, 1, '10:00:00', 8),
(116, 1, '10:30:00', 8),
(117, 1, '11:00:00', 8),
(118, 1, '11:30:00', 8),
(119, 1, '12:00:00', 8),
(120, 1, '12:30:00', 8),
(121, 1, '13:00:00', 8),
(122, 1, '13:30:00', 8),
(123, 1, '14:00:00', 8),
(124, 1, '14:30:00', 8),
(125, 1, '15:00:00', 8),
(126, 1, '15:30:00', 8),
(127, 1, '16:00:00', 8),
(128, 1, '16:30:00', 8),
(129, 1, '09:00:00', 9),
(130, 1, '09:30:00', 9),
(131, 1, '10:00:00', 9),
(132, 1, '10:30:00', 9),
(133, 1, '11:00:00', 9),
(134, 1, '11:30:00', 9),
(135, 1, '12:00:00', 9),
(136, 1, '12:30:00', 9),
(137, 1, '13:00:00', 9),
(138, 1, '13:30:00', 9),
(139, 1, '14:00:00', 9),
(140, 1, '14:30:00', 9),
(141, 1, '15:00:00', 9),
(142, 1, '15:30:00', 9),
(143, 1, '16:00:00', 9),
(144, 1, '16:30:00', 9),
(145, 1, '09:00:00', 10),
(146, 1, '09:30:00', 10),
(147, 1, '10:00:00', 10),
(148, 1, '10:30:00', 10),
(149, 1, '11:00:00', 10),
(150, 1, '11:30:00', 10),
(151, 1, '12:00:00', 10),
(152, 1, '12:30:00', 10),
(153, 1, '13:00:00', 10),
(154, 1, '13:30:00', 10),
(155, 1, '14:00:00', 10),
(156, 1, '14:30:00', 10),
(157, 1, '15:00:00', 10),
(158, 1, '15:30:00', 10),
(159, 1, '16:00:00', 10),
(160, 1, '16:30:00', 10),
(161, 1, '09:00:00', 11),
(162, 1, '09:30:00', 11),
(163, 1, '10:00:00', 11),
(164, 1, '10:30:00', 11),
(165, 1, '11:00:00', 11),
(166, 1, '11:30:00', 11),
(167, 1, '12:00:00', 11),
(168, 1, '12:30:00', 11),
(169, 1, '13:00:00', 11),
(170, 1, '13:30:00', 11),
(171, 1, '14:00:00', 11),
(172, 1, '14:30:00', 11),
(173, 1, '15:00:00', 11),
(174, 1, '15:30:00', 11),
(175, 1, '16:00:00', 11),
(176, 1, '16:30:00', 11),
(177, 1, '09:00:00', 12),
(178, 1, '09:30:00', 12),
(179, 1, '10:00:00', 12),
(180, 1, '10:30:00', 12),
(181, 1, '11:00:00', 12),
(182, 1, '11:30:00', 12),
(183, 1, '12:00:00', 12),
(184, 1, '12:30:00', 12),
(185, 1, '13:00:00', 12),
(186, 1, '13:30:00', 12),
(187, 1, '14:00:00', 12),
(188, 1, '14:30:00', 12),
(189, 1, '15:00:00', 12),
(190, 1, '15:30:00', 12),
(191, 1, '16:00:00', 12),
(192, 1, '16:30:00', 12),
(193, 1, '09:00:00', 13),
(194, 1, '09:30:00', 13),
(195, 1, '10:00:00', 13),
(196, 1, '10:30:00', 13),
(197, 1, '11:00:00', 13),
(198, 1, '11:30:00', 13),
(199, 1, '12:00:00', 13),
(200, 1, '12:30:00', 13),
(201, 1, '13:00:00', 13),
(202, 1, '13:30:00', 13),
(203, 1, '14:00:00', 13),
(204, 1, '14:30:00', 13),
(205, 1, '15:00:00', 13),
(206, 1, '15:30:00', 13),
(207, 1, '16:00:00', 13),
(208, 1, '16:30:00', 13),
(209, 1, '09:00:00', 14),
(210, 1, '09:30:00', 14),
(211, 1, '10:00:00', 14),
(212, 1, '10:30:00', 14),
(213, 1, '11:00:00', 14),
(214, 1, '11:30:00', 14),
(215, 1, '12:00:00', 14),
(216, 1, '12:30:00', 14),
(217, 1, '13:00:00', 14),
(218, 1, '13:30:00', 14),
(219, 1, '14:00:00', 14),
(220, 1, '14:30:00', 14),
(221, 1, '15:00:00', 14),
(222, 1, '15:30:00', 14),
(223, 1, '16:00:00', 14),
(224, 1, '16:30:00', 14),
(225, 1, '09:00:00', 15),
(226, 1, '09:30:00', 15),
(227, 1, '10:00:00', 15),
(228, 1, '10:30:00', 15),
(229, 1, '11:00:00', 15),
(230, 1, '11:30:00', 15),
(231, 1, '12:00:00', 15),
(232, 1, '12:30:00', 15),
(233, 1, '13:00:00', 15),
(234, 1, '13:30:00', 15),
(235, 1, '14:00:00', 15),
(236, 1, '14:30:00', 15),
(237, 1, '15:00:00', 15),
(238, 1, '15:30:00', 15),
(239, 1, '16:00:00', 15),
(240, 1, '16:30:00', 15),
(241, 1, '09:00:00', 16),
(242, 1, '09:30:00', 16),
(243, 1, '10:00:00', 16),
(244, 1, '10:30:00', 16),
(245, 1, '11:00:00', 16),
(246, 1, '11:30:00', 16),
(247, 1, '12:00:00', 16),
(248, 1, '12:30:00', 16),
(249, 1, '13:00:00', 16),
(250, 1, '13:30:00', 16),
(251, 1, '14:00:00', 16),
(252, 1, '14:30:00', 16),
(253, 1, '15:00:00', 16),
(254, 1, '15:30:00', 16),
(255, 1, '16:00:00', 16),
(256, 1, '16:30:00', 16),
(257, 1, '09:00:00', 17),
(258, 1, '09:30:00', 17),
(259, 1, '10:00:00', 17),
(260, 1, '10:30:00', 17),
(261, 1, '11:00:00', 17),
(262, 1, '11:30:00', 17),
(263, 1, '12:00:00', 17),
(264, 1, '12:30:00', 17),
(265, 1, '13:00:00', 17),
(266, 1, '13:30:00', 17),
(267, 1, '14:00:00', 17),
(268, 1, '14:30:00', 17),
(269, 1, '15:00:00', 17),
(270, 1, '15:30:00', 17),
(271, 1, '16:00:00', 17),
(272, 1, '16:30:00', 17),
(273, 1, '09:00:00', 18),
(274, 1, '09:30:00', 18),
(275, 1, '10:00:00', 18),
(276, 1, '10:30:00', 18),
(277, 1, '11:00:00', 18),
(278, 1, '11:30:00', 18),
(279, 1, '12:00:00', 18),
(280, 1, '12:30:00', 18),
(281, 1, '13:00:00', 18),
(282, 1, '13:30:00', 18),
(283, 1, '14:00:00', 18),
(284, 1, '14:30:00', 18),
(285, 1, '15:00:00', 18),
(286, 1, '15:30:00', 18),
(287, 1, '16:00:00', 18),
(288, 1, '16:30:00', 18),
(289, 1, '09:00:00', 19),
(290, 1, '09:30:00', 19),
(291, 1, '10:00:00', 19),
(292, 1, '10:30:00', 19),
(293, 1, '11:00:00', 19),
(294, 1, '11:30:00', 19),
(295, 1, '12:00:00', 19),
(296, 1, '12:30:00', 19),
(297, 1, '13:00:00', 19),
(298, 1, '13:30:00', 19),
(299, 1, '14:00:00', 19),
(300, 1, '14:30:00', 19),
(301, 1, '15:00:00', 19),
(302, 1, '15:30:00', 19),
(303, 1, '16:00:00', 19),
(304, 1, '16:30:00', 19),
(305, 1, '09:00:00', 20),
(306, 1, '09:30:00', 20),
(307, 1, '10:00:00', 20),
(308, 1, '10:30:00', 20),
(309, 1, '11:00:00', 20),
(310, 1, '11:30:00', 20),
(311, 1, '12:00:00', 20),
(312, 1, '12:30:00', 20),
(313, 1, '13:00:00', 20),
(314, 1, '13:30:00', 20),
(315, 1, '14:00:00', 20),
(316, 1, '14:30:00', 20),
(317, 1, '15:00:00', 20),
(318, 1, '15:30:00', 20),
(319, 1, '16:00:00', 20),
(320, 1, '16:30:00', 20),
(321, 1, '09:00:00', 21),
(322, 1, '09:30:00', 21),
(323, 1, '10:00:00', 21),
(324, 1, '10:30:00', 21),
(325, 1, '11:00:00', 21),
(326, 1, '11:30:00', 21),
(327, 1, '12:00:00', 21),
(328, 1, '12:30:00', 21),
(329, 1, '13:00:00', 21),
(330, 1, '13:30:00', 21),
(331, 1, '14:00:00', 21),
(332, 1, '14:30:00', 21),
(333, 1, '15:00:00', 21),
(334, 1, '15:30:00', 21),
(335, 1, '16:00:00', 21),
(336, 1, '16:30:00', 21),
(337, 1, '09:00:00', 22),
(338, 1, '09:30:00', 22),
(339, 1, '10:00:00', 22),
(340, 1, '10:30:00', 22),
(341, 1, '11:00:00', 22),
(342, 1, '11:30:00', 22),
(343, 1, '12:00:00', 22),
(344, 1, '12:30:00', 22),
(345, 1, '13:00:00', 22),
(346, 1, '13:30:00', 22),
(347, 1, '14:00:00', 22),
(348, 1, '14:30:00', 22),
(349, 1, '15:00:00', 22),
(350, 1, '15:30:00', 22),
(351, 1, '16:00:00', 22),
(352, 1, '16:30:00', 22),
(353, 1, '09:00:00', 23),
(354, 1, '09:30:00', 23),
(355, 1, '10:00:00', 23),
(356, 1, '10:30:00', 23),
(357, 1, '11:00:00', 23),
(358, 1, '11:30:00', 23),
(359, 1, '12:00:00', 23),
(360, 1, '12:30:00', 23),
(361, 1, '13:00:00', 23),
(362, 1, '13:30:00', 23),
(363, 1, '14:00:00', 23),
(364, 1, '14:30:00', 23),
(365, 1, '15:00:00', 23),
(366, 1, '15:30:00', 23),
(367, 1, '16:00:00', 23),
(368, 1, '16:30:00', 23),
(369, 1, '09:00:00', 24),
(370, 1, '09:30:00', 24),
(371, 1, '10:00:00', 24),
(372, 1, '10:30:00', 24),
(373, 1, '11:00:00', 24),
(374, 1, '11:30:00', 24),
(375, 1, '12:00:00', 24),
(376, 1, '12:30:00', 24),
(377, 1, '13:00:00', 24),
(378, 1, '13:30:00', 24),
(379, 1, '14:00:00', 24),
(380, 1, '14:30:00', 24),
(381, 1, '15:00:00', 24),
(382, 1, '15:30:00', 24),
(383, 1, '16:00:00', 24),
(384, 1, '16:30:00', 24),
(385, 1, '09:00:00', 25),
(386, 1, '09:30:00', 25),
(387, 1, '10:00:00', 25),
(388, 1, '10:30:00', 25),
(389, 1, '11:00:00', 25),
(390, 1, '11:30:00', 25),
(391, 1, '12:00:00', 25),
(392, 1, '12:30:00', 25),
(393, 1, '13:00:00', 25),
(394, 1, '13:30:00', 25),
(395, 1, '14:00:00', 25),
(396, 1, '14:30:00', 25),
(397, 1, '15:00:00', 25),
(398, 1, '15:30:00', 25),
(399, 1, '16:00:00', 25),
(400, 1, '16:30:00', 25),
(401, 1, '09:00:00', 26),
(402, 1, '09:30:00', 26),
(403, 1, '10:00:00', 26),
(404, 1, '10:30:00', 26),
(405, 1, '11:00:00', 26),
(406, 1, '11:30:00', 26),
(407, 1, '12:00:00', 26),
(408, 1, '12:30:00', 26),
(409, 1, '13:00:00', 26),
(410, 1, '13:30:00', 26),
(411, 1, '14:00:00', 26),
(412, 1, '14:30:00', 26),
(413, 1, '15:00:00', 26),
(414, 1, '15:30:00', 26),
(415, 1, '16:00:00', 26),
(416, 1, '16:30:00', 26),
(417, 1, '09:00:00', 27),
(418, 1, '09:30:00', 27),
(419, 1, '10:00:00', 27),
(420, 1, '10:30:00', 27),
(421, 1, '11:00:00', 27),
(422, 1, '11:30:00', 27),
(423, 1, '12:00:00', 27),
(424, 1, '12:30:00', 27),
(425, 1, '13:00:00', 27),
(426, 1, '13:30:00', 27),
(427, 1, '14:00:00', 27),
(428, 1, '14:30:00', 27),
(429, 1, '15:00:00', 27),
(430, 1, '15:30:00', 27),
(431, 1, '16:00:00', 27),
(432, 1, '16:30:00', 27),
(433, 1, '09:00:00', 28),
(434, 1, '09:30:00', 28),
(435, 1, '10:00:00', 28),
(436, 1, '10:30:00', 28),
(437, 1, '11:00:00', 28),
(438, 1, '11:30:00', 28),
(439, 1, '12:00:00', 28),
(440, 1, '12:30:00', 28),
(441, 1, '13:00:00', 28),
(442, 1, '13:30:00', 28),
(443, 1, '14:00:00', 28),
(444, 1, '14:30:00', 28),
(445, 1, '15:00:00', 28),
(446, 1, '15:30:00', 28),
(447, 1, '16:00:00', 28),
(448, 1, '16:30:00', 28),
(449, 1, '09:00:00', 29),
(450, 1, '09:30:00', 29),
(451, 1, '10:00:00', 29),
(452, 1, '10:30:00', 29),
(453, 1, '11:00:00', 29),
(454, 1, '11:30:00', 29),
(455, 1, '12:00:00', 29),
(456, 1, '12:30:00', 29),
(457, 1, '13:00:00', 29),
(458, 1, '13:30:00', 29),
(459, 1, '14:00:00', 29),
(460, 1, '14:30:00', 29),
(461, 1, '15:00:00', 29),
(462, 1, '15:30:00', 29),
(463, 1, '16:00:00', 29),
(464, 1, '16:30:00', 29),
(465, 1, '09:00:00', 30),
(466, 1, '09:30:00', 30),
(467, 1, '10:00:00', 30),
(468, 1, '10:30:00', 30),
(469, 1, '11:00:00', 30),
(470, 1, '11:30:00', 30),
(471, 1, '12:00:00', 30),
(472, 1, '12:30:00', 30),
(473, 1, '13:00:00', 30),
(474, 1, '13:30:00', 30),
(475, 1, '14:00:00', 30),
(476, 1, '14:30:00', 30),
(477, 1, '15:00:00', 30),
(478, 1, '15:30:00', 30),
(479, 1, '16:00:00', 30),
(480, 1, '16:30:00', 30),
(481, 1, '09:00:00', 31),
(482, 1, '09:30:00', 31),
(483, 1, '10:00:00', 31),
(484, 1, '10:30:00', 31),
(485, 1, '11:00:00', 31),
(486, 1, '11:30:00', 31),
(487, 1, '12:00:00', 31),
(488, 1, '12:30:00', 31),
(489, 1, '13:00:00', 31),
(490, 1, '13:30:00', 31),
(491, 1, '14:00:00', 31),
(492, 1, '14:30:00', 31),
(493, 1, '15:00:00', 31),
(494, 1, '15:30:00', 31),
(495, 1, '16:00:00', 31),
(496, 1, '23:30:00', 31),
(497, 1, '09:00:00', 32),
(498, 1, '09:30:00', 32),
(499, 1, '10:00:00', 32),
(500, 1, '10:30:00', 32),
(501, 1, '11:00:00', 32),
(502, 1, '11:30:00', 32),
(503, 1, '12:00:00', 32),
(504, 1, '12:30:00', 32),
(505, 1, '13:00:00', 32),
(506, 1, '13:30:00', 32),
(507, 1, '14:00:00', 32),
(508, 1, '14:30:00', 32),
(509, 1, '15:00:00', 32),
(510, 1, '15:30:00', 32),
(511, 1, '16:00:00', 32),
(512, 1, '16:30:00', 32),
(513, 1, '09:00:00', 33),
(514, 1, '09:30:00', 33),
(515, 1, '10:00:00', 33),
(516, 1, '10:30:00', 33),
(517, 1, '11:00:00', 33),
(518, 1, '11:30:00', 33),
(519, 1, '12:00:00', 33),
(520, 1, '12:30:00', 33),
(521, 1, '13:00:00', 33),
(522, 1, '13:30:00', 33),
(523, 1, '14:00:00', 33),
(524, 1, '14:30:00', 33),
(525, 1, '15:00:00', 33),
(526, 1, '15:30:00', 33),
(527, 1, '16:00:00', 33),
(528, 1, '16:30:00', 33),
(529, 1, '09:00:00', 34),
(530, 1, '09:30:00', 34),
(531, 1, '10:00:00', 34),
(532, 1, '10:30:00', 34),
(533, 1, '11:00:00', 34),
(534, 1, '11:30:00', 34),
(535, 1, '12:00:00', 34),
(536, 1, '12:30:00', 34),
(537, 1, '13:00:00', 34),
(538, 1, '13:30:00', 34),
(539, 1, '14:00:00', 34),
(540, 1, '14:30:00', 34),
(541, 1, '15:00:00', 34),
(542, 1, '15:30:00', 34),
(543, 1, '16:00:00', 34),
(544, 1, '16:30:00', 34),
(545, 1, '09:00:00', 35),
(546, 1, '09:30:00', 35),
(547, 1, '10:00:00', 35),
(548, 1, '10:30:00', 35),
(549, 1, '11:00:00', 35),
(550, 1, '11:30:00', 35),
(551, 1, '12:00:00', 35),
(552, 1, '12:30:00', 35),
(553, 1, '13:00:00', 35),
(554, 1, '13:30:00', 35),
(555, 1, '14:00:00', 35),
(556, 1, '14:30:00', 35),
(557, 1, '15:00:00', 35),
(558, 1, '15:30:00', 35),
(559, 1, '16:00:00', 35),
(560, 1, '16:30:00', 35),
(561, 1, '09:00:00', 36),
(562, 1, '09:30:00', 36),
(563, 1, '10:00:00', 36),
(564, 1, '10:30:00', 36),
(565, 1, '11:00:00', 36),
(566, 1, '11:30:00', 36),
(567, 1, '12:00:00', 36),
(568, 1, '12:30:00', 36),
(569, 1, '13:00:00', 36),
(570, 1, '13:30:00', 36),
(571, 1, '14:00:00', 36),
(572, 1, '14:30:00', 36),
(573, 1, '15:00:00', 36),
(574, 1, '15:30:00', 36),
(575, 1, '16:00:00', 36),
(576, 1, '16:30:00', 36),
(577, 1, '09:00:00', 37),
(578, 1, '09:30:00', 37),
(579, 1, '10:00:00', 37),
(580, 1, '10:30:00', 37),
(581, 1, '11:00:00', 37),
(582, 1, '11:30:00', 37),
(583, 1, '12:00:00', 37),
(584, 1, '12:30:00', 37),
(585, 1, '13:00:00', 37),
(586, 1, '13:30:00', 37),
(587, 1, '14:00:00', 37),
(588, 1, '14:30:00', 37),
(589, 1, '15:00:00', 37),
(590, 1, '15:30:00', 37),
(591, 1, '16:00:00', 37),
(592, 1, '16:30:00', 37),
(593, 1, '09:00:00', 38),
(594, 1, '09:30:00', 38),
(595, 1, '10:00:00', 38),
(596, 1, '10:30:00', 38),
(597, 1, '11:00:00', 38),
(598, 1, '11:30:00', 38),
(599, 1, '12:00:00', 38),
(600, 1, '12:30:00', 38),
(601, 1, '13:00:00', 38),
(602, 1, '13:30:00', 38),
(603, 1, '14:00:00', 38),
(604, 1, '14:30:00', 38),
(605, 1, '15:00:00', 38),
(606, 1, '15:30:00', 38),
(607, 1, '16:00:00', 38),
(608, 1, '16:30:00', 38),
(609, 1, '09:00:00', 39),
(610, 1, '09:30:00', 39),
(611, 1, '10:00:00', 39),
(612, 1, '10:30:00', 39),
(613, 1, '11:00:00', 39),
(614, 1, '11:30:00', 39),
(615, 1, '12:00:00', 39),
(616, 1, '12:30:00', 39),
(617, 1, '13:00:00', 39),
(618, 1, '13:30:00', 39),
(619, 1, '14:00:00', 39),
(620, 1, '14:30:00', 39),
(621, 1, '15:00:00', 39),
(622, 1, '15:30:00', 39),
(623, 1, '16:00:00', 39),
(624, 1, '16:30:00', 39),
(625, 1, '09:00:00', 40),
(626, 1, '09:30:00', 40),
(627, 1, '10:00:00', 40),
(628, 1, '10:30:00', 40),
(629, 1, '11:00:00', 40),
(630, 1, '11:30:00', 40),
(631, 1, '12:00:00', 40),
(632, 1, '12:30:00', 40),
(633, 1, '13:00:00', 40),
(634, 1, '13:30:00', 40),
(635, 1, '14:00:00', 40),
(636, 1, '14:30:00', 40),
(637, 1, '15:00:00', 40),
(638, 1, '15:30:00', 40),
(639, 1, '16:00:00', 40),
(640, 1, '16:30:00', 40),
(641, 1, '09:00:00', 41),
(642, 1, '09:30:00', 41),
(643, 1, '10:00:00', 41),
(644, 1, '10:30:00', 41),
(645, 1, '11:00:00', 41),
(646, 1, '11:30:00', 41),
(647, 1, '12:00:00', 41),
(648, 1, '12:30:00', 41),
(649, 1, '13:00:00', 41),
(650, 1, '13:30:00', 41),
(651, 1, '14:00:00', 41),
(652, 1, '14:30:00', 41),
(653, 1, '15:00:00', 41),
(654, 1, '15:30:00', 41),
(655, 1, '16:00:00', 41),
(656, 1, '16:30:00', 41),
(657, 1, '09:00:00', 42),
(658, 1, '09:30:00', 42),
(659, 1, '10:00:00', 42),
(660, 1, '10:30:00', 42),
(661, 1, '11:00:00', 42),
(662, 1, '11:30:00', 42),
(663, 1, '12:00:00', 42),
(664, 1, '12:30:00', 42),
(665, 1, '13:00:00', 42),
(666, 1, '13:30:00', 42),
(667, 1, '14:00:00', 42),
(668, 1, '14:30:00', 42),
(669, 1, '15:00:00', 42),
(670, 1, '15:30:00', 42),
(671, 1, '16:00:00', 42),
(672, 1, '16:30:00', 42),
(673, 1, '09:00:00', 43),
(674, 1, '09:30:00', 43),
(675, 1, '10:00:00', 43),
(676, 1, '10:30:00', 43),
(677, 1, '11:00:00', 43),
(678, 1, '11:30:00', 43),
(679, 1, '12:00:00', 43),
(680, 1, '12:30:00', 43),
(681, 1, '13:00:00', 43),
(682, 1, '13:30:00', 43),
(683, 1, '14:00:00', 43),
(684, 1, '14:30:00', 43),
(685, 1, '15:00:00', 43),
(686, 1, '15:30:00', 43),
(687, 1, '16:00:00', 43),
(688, 1, '16:30:00', 43),
(689, 1, '09:00:00', 44),
(690, 1, '09:30:00', 44),
(691, 1, '10:00:00', 44),
(692, 1, '10:30:00', 44),
(693, 1, '11:00:00', 44),
(694, 1, '11:30:00', 44),
(695, 1, '12:00:00', 44),
(696, 1, '12:30:00', 44),
(697, 1, '13:00:00', 44),
(698, 1, '13:30:00', 44),
(699, 1, '14:00:00', 44),
(700, 1, '14:30:00', 44),
(701, 1, '15:00:00', 44),
(702, 1, '15:30:00', 44),
(703, 1, '16:00:00', 44),
(704, 1, '16:30:00', 44),
(705, 1, '09:00:00', 45),
(706, 1, '09:30:00', 45),
(707, 1, '10:00:00', 45),
(708, 1, '10:30:00', 45),
(709, 1, '11:00:00', 45),
(710, 1, '11:30:00', 45),
(711, 1, '12:00:00', 45),
(712, 1, '12:30:00', 45),
(713, 1, '13:00:00', 45),
(714, 1, '13:30:00', 45),
(715, 1, '14:00:00', 45),
(716, 1, '14:30:00', 45),
(717, 1, '15:00:00', 45),
(718, 1, '15:30:00', 45),
(719, 1, '16:00:00', 45),
(720, 1, '16:30:00', 45),
(721, 1, '09:00:00', 46),
(722, 1, '09:30:00', 46),
(723, 1, '10:00:00', 46),
(724, 1, '10:30:00', 46),
(725, 1, '11:00:00', 46),
(726, 1, '11:30:00', 46),
(727, 1, '12:00:00', 46),
(728, 1, '12:30:00', 46),
(729, 1, '13:00:00', 46),
(730, 1, '13:30:00', 46),
(731, 1, '14:00:00', 46),
(732, 1, '14:30:00', 46),
(733, 1, '15:00:00', 46),
(734, 1, '15:30:00', 46),
(735, 1, '16:00:00', 46),
(736, 1, '16:30:00', 46),
(1024, 1, '00:00:00', 47),
(1144, 1, '08:00:00', 55),
(1145, 1, '09:00:00', 55),
(1146, 1, '10:00:00', 55),
(1147, 1, '11:00:00', 55),
(1148, 1, '12:00:00', 55),
(1149, 1, '13:00:00', 55),
(1150, 1, '14:00:00', 55),
(1151, 1, '15:00:00', 55),
(1152, 1, '16:00:00', 55),
(1153, 1, '17:00:00', 55),
(1154, 1, '18:00:00', 55),
(1155, 1, '19:00:00', 55),
(1156, 1, '20:00:00', 55),
(1157, 1, '21:00:00', 55),
(1158, 1, '08:00:00', 56),
(1159, 1, '09:00:00', 56),
(1160, 1, '10:00:00', 56),
(1161, 1, '11:00:00', 56),
(1162, 1, '12:00:00', 56),
(1163, 1, '13:00:00', 56),
(1164, 1, '14:00:00', 56),
(1165, 1, '15:00:00', 56),
(1166, 1, '16:00:00', 56),
(1167, 1, '17:00:00', 56),
(1168, 1, '18:00:00', 56),
(1169, 1, '19:00:00', 56),
(1170, 1, '20:00:00', 56),
(1171, 1, '21:00:00', 56),
(1172, 1, '08:00:00', 57),
(1173, 1, '09:00:00', 57),
(1174, 1, '10:00:00', 57),
(1175, 1, '11:00:00', 57),
(1176, 1, '12:00:00', 57),
(1177, 1, '13:00:00', 57),
(1178, 1, '14:00:00', 57),
(1179, 1, '15:00:00', 57),
(1180, 1, '16:00:00', 57),
(1181, 1, '17:00:00', 57),
(1182, 1, '18:00:00', 57),
(1183, 1, '19:00:00', 57),
(1184, 1, '20:00:00', 57),
(1185, 1, '21:00:00', 57),
(1186, 1, '08:00:00', 58),
(1187, 1, '09:00:00', 58),
(1188, 1, '10:00:00', 58),
(1189, 1, '11:00:00', 58),
(1190, 1, '12:00:00', 58),
(1191, 1, '13:00:00', 58),
(1192, 1, '14:00:00', 58),
(1193, 1, '15:00:00', 58),
(1194, 1, '16:00:00', 58),
(1195, 1, '17:00:00', 58),
(1196, 1, '18:00:00', 58),
(1197, 1, '19:00:00', 58),
(1198, 1, '20:00:00', 58),
(1199, 1, '21:00:00', 58),
(1200, 1, '08:00:00', 59),
(1201, 1, '09:00:00', 59),
(1202, 1, '10:00:00', 59),
(1203, 1, '11:00:00', 59),
(1204, 1, '12:00:00', 59),
(1205, 1, '13:00:00', 59),
(1206, 1, '14:00:00', 59),
(1207, 1, '15:00:00', 59),
(1208, 1, '16:00:00', 59),
(1209, 1, '17:00:00', 59),
(1210, 1, '18:00:00', 59),
(1211, 1, '19:00:00', 59),
(1212, 1, '20:00:00', 59),
(1213, 1, '21:00:00', 59),
(1214, 1, '08:00:00', 60),
(1215, 1, '09:00:00', 60),
(1216, 1, '10:00:00', 60),
(1217, 1, '11:00:00', 60),
(1218, 1, '12:00:00', 60),
(1219, 1, '13:00:00', 60),
(1220, 1, '14:00:00', 60),
(1221, 1, '15:00:00', 60),
(1222, 1, '16:00:00', 60),
(1223, 1, '17:00:00', 60),
(1224, 1, '18:00:00', 60),
(1225, 1, '19:00:00', 60),
(1226, 1, '20:00:00', 60),
(1227, 1, '21:00:00', 60),
(1228, 1, '08:00:00', 61),
(1229, 1, '09:00:00', 61),
(1230, 1, '10:00:00', 61),
(1231, 1, '11:00:00', 61),
(1232, 1, '12:00:00', 61),
(1233, 1, '13:00:00', 61),
(1234, 1, '14:00:00', 61),
(1235, 1, '15:00:00', 61),
(1236, 1, '16:00:00', 61),
(1237, 1, '17:00:00', 61),
(1238, 1, '18:00:00', 61),
(1239, 1, '19:00:00', 61),
(1240, 1, '20:00:00', 61),
(1241, 1, '21:00:00', 61);

--
-- Chỉ mục cho các bảng đã đổ
--

--
-- Chỉ mục cho bảng `address_ship`
--
ALTER TABLE `address_ship`
  ADD PRIMARY KEY (`Id_address_ship`);

--
-- Chỉ mục cho bảng `bookings`
--
ALTER TABLE `bookings`
  ADD PRIMARY KEY (`Id_booking`),
  ADD KEY `FK_BOOKING_STORE` (`Id_store`),
  ADD KEY `FK_BOOKING_USER` (`Id_user`),
  ADD KEY `FK_BOOKING_STYLIST` (`Id_stylist`);

--
-- Chỉ mục cho bảng `booking_detail`
--
ALTER TABLE `booking_detail`
  ADD PRIMARY KEY (`Id_Booking_detail`),
  ADD KEY `FK_BKD_BOOKING` (`Id_booking`),
  ADD KEY `FK_BKD_COMBO` (`Id_combo`),
  ADD KEY `FK_BKD_SERVICE` (`Id_services`);

--
-- Chỉ mục cho bảng `booking_rating`
--
ALTER TABLE `booking_rating`
  ADD PRIMARY KEY (`Id_Booking_rating`),
  ADD KEY `FK_Rate_BKD` (`Id_booking_detail`),
  ADD KEY `FK_Rate_User` (`Id_user`);

--
-- Chỉ mục cho bảng `booking_result_images`
--
ALTER TABLE `booking_result_images`
  ADD PRIMARY KEY (`Id_Collection_hair`),
  ADD KEY `FK_Image_booking` (`Id_booking`);

--
-- Chỉ mục cho bảng `brands`
--
ALTER TABLE `brands`
  ADD PRIMARY KEY (`Id_brand`);

--
-- Chỉ mục cho bảng `categories_product`
--
ALTER TABLE `categories_product`
  ADD PRIMARY KEY (`Id_category_products`);

--
-- Chỉ mục cho bảng `categories_service`
--
ALTER TABLE `categories_service`
  ADD PRIMARY KEY (`Id_category_service`);

--
-- Chỉ mục cho bảng `category_news`
--
ALTER TABLE `category_news`
  ADD PRIMARY KEY (`Id_category_news`);

--
-- Chỉ mục cho bảng `combos`
--
ALTER TABLE `combos`
  ADD PRIMARY KEY (`Id_combo`);

--
-- Chỉ mục cho bảng `combo_detail`
--
ALTER TABLE `combo_detail`
  ADD PRIMARY KEY (`Id_services`,`Id_combo`),
  ADD KEY `FK_COMBO` (`Id_combo`);

--
-- Chỉ mục cho bảng `favorite_products`
--
ALTER TABLE `favorite_products`
  ADD PRIMARY KEY (`Id_Favorite_product`),
  ADD KEY `FK_FVR_PRO` (`Id_product`),
  ADD KEY `FK_FVR_USER` (`Id_user`);

--
-- Chỉ mục cho bảng `image_products`
--
ALTER TABLE `image_products`
  ADD PRIMARY KEY (`Id_image_product`),
  ADD KEY `FK_IMAGE_PRODUCT` (`Id_product`);

--
-- Chỉ mục cho bảng `image_services`
--
ALTER TABLE `image_services`
  ADD PRIMARY KEY (`Id_image_service`),
  ADD KEY `FK_IMG_SERVICE` (`Id_services`);

--
-- Chỉ mục cho bảng `news`
--
ALTER TABLE `news`
  ADD PRIMARY KEY (`Id_news`),
  ADD KEY `FK_NEWS_CATE` (`Id_category_news`);

--
-- Chỉ mục cho bảng `orders`
--
ALTER TABLE `orders`
  ADD PRIMARY KEY (`Id_order`),
  ADD KEY `FK_ORDER_USER` (`Id_user`),
  ADD KEY `FK_ORDER_PAYMENT` (`Id_payment`),
  ADD KEY `FK_ORDER_VOUCHER` (`Id_voucher`);

--
-- Chỉ mục cho bảng `order_detail`
--
ALTER TABLE `order_detail`
  ADD PRIMARY KEY (`Id_product`,`Id_order`),
  ADD KEY `FK_ORDER` (`Id_order`);

--
-- Chỉ mục cho bảng `payment_method`
--
ALTER TABLE `payment_method`
  ADD PRIMARY KEY (`Id_payment_method`);

--
-- Chỉ mục cho bảng `products`
--
ALTER TABLE `products`
  ADD PRIMARY KEY (`Id_product`),
  ADD KEY `FK_PR_BR` (`Id_brand`),
  ADD KEY `FK_PR_CATE` (`Id_category_product`);

--
-- Chỉ mục cho bảng `product_comments`
--
ALTER TABLE `product_comments`
  ADD PRIMARY KEY (`Id_product_comment`),
  ADD KEY `FK_PRCMT_USER` (`Id_user`),
  ADD KEY `FK_PRCMT_PRO` (`Id_product`);

--
-- Chỉ mục cho bảng `services`
--
ALTER TABLE `services`
  ADD PRIMARY KEY (`Id_services`),
  ADD KEY `FK_SERVICE_CATE` (`Id_category_service`);

--
-- Chỉ mục cho bảng `stores`
--
ALTER TABLE `stores`
  ADD PRIMARY KEY (`Id_store`);

--
-- Chỉ mục cho bảng `users`
--
ALTER TABLE `users`
  ADD PRIMARY KEY (`Id_user`),
  ADD KEY `FK_USER_STORE` (`Id_store`);

--
-- Chỉ mục cho bảng `vouchers`
--
ALTER TABLE `vouchers`
  ADD PRIMARY KEY (`Id_voucher`);

--
-- Chỉ mục cho bảng `work_shifts`
--
ALTER TABLE `work_shifts`
  ADD PRIMARY KEY (`Id_work_shifts`),
  ADD KEY `FK_WKS_USER` (`Id_user`);

--
-- Chỉ mục cho bảng `work_shifts_hours`
--
ALTER TABLE `work_shifts_hours`
  ADD PRIMARY KEY (`Id_work_shifts_hour`),
  ADD KEY `FK_WKSHOURS_WKS` (`Id_work_shifts`);

--
-- AUTO_INCREMENT cho các bảng đã đổ
--

--
-- AUTO_INCREMENT cho bảng `address_ship`
--
ALTER TABLE `address_ship`
  MODIFY `Id_address_ship` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=3;

--
-- AUTO_INCREMENT cho bảng `bookings`
--
ALTER TABLE `bookings`
  MODIFY `Id_booking` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=4;

--
-- AUTO_INCREMENT cho bảng `booking_detail`
--
ALTER TABLE `booking_detail`
  MODIFY `Id_Booking_detail` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=4;

--
-- AUTO_INCREMENT cho bảng `booking_rating`
--
ALTER TABLE `booking_rating`
  MODIFY `Id_Booking_rating` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=3;

--
-- AUTO_INCREMENT cho bảng `booking_result_images`
--
ALTER TABLE `booking_result_images`
  MODIFY `Id_Collection_hair` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=21;

--
-- AUTO_INCREMENT cho bảng `brands`
--
ALTER TABLE `brands`
  MODIFY `Id_brand` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=6;

--
-- AUTO_INCREMENT cho bảng `categories_product`
--
ALTER TABLE `categories_product`
  MODIFY `Id_category_products` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=20;

--
-- AUTO_INCREMENT cho bảng `categories_service`
--
ALTER TABLE `categories_service`
  MODIFY `Id_category_service` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=6;

--
-- AUTO_INCREMENT cho bảng `category_news`
--
ALTER TABLE `category_news`
  MODIFY `Id_category_news` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=6;

--
-- AUTO_INCREMENT cho bảng `combos`
--
ALTER TABLE `combos`
  MODIFY `Id_combo` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=13;

--
-- AUTO_INCREMENT cho bảng `favorite_products`
--
ALTER TABLE `favorite_products`
  MODIFY `Id_Favorite_product` int NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT cho bảng `image_products`
--
ALTER TABLE `image_products`
  MODIFY `Id_image_product` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=35;

--
-- AUTO_INCREMENT cho bảng `image_services`
--
ALTER TABLE `image_services`
  MODIFY `Id_image_service` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=18;

--
-- AUTO_INCREMENT cho bảng `news`
--
ALTER TABLE `news`
  MODIFY `Id_news` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=6;

--
-- AUTO_INCREMENT cho bảng `orders`
--
ALTER TABLE `orders`
  MODIFY `Id_order` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=15;

--
-- AUTO_INCREMENT cho bảng `payment_method`
--
ALTER TABLE `payment_method`
  MODIFY `Id_payment_method` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=2;

--
-- AUTO_INCREMENT cho bảng `products`
--
ALTER TABLE `products`
  MODIFY `Id_product` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=188;

--
-- AUTO_INCREMENT cho bảng `product_comments`
--
ALTER TABLE `product_comments`
  MODIFY `Id_product_comment` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=2;

--
-- AUTO_INCREMENT cho bảng `services`
--
ALTER TABLE `services`
  MODIFY `Id_services` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=44;

--
-- AUTO_INCREMENT cho bảng `stores`
--
ALTER TABLE `stores`
  MODIFY `Id_store` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=36;

--
-- AUTO_INCREMENT cho bảng `users`
--
ALTER TABLE `users`
  MODIFY `Id_user` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=4466;

--
-- AUTO_INCREMENT cho bảng `vouchers`
--
ALTER TABLE `vouchers`
  MODIFY `Id_voucher` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=4;

--
-- AUTO_INCREMENT cho bảng `work_shifts`
--
ALTER TABLE `work_shifts`
  MODIFY `Id_work_shifts` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=62;

--
-- AUTO_INCREMENT cho bảng `work_shifts_hours`
--
ALTER TABLE `work_shifts_hours`
  MODIFY `Id_work_shifts_hour` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=1242;

--
-- Các ràng buộc cho các bảng đã đổ
--

--
-- Các ràng buộc cho bảng `address_ship`
--
ALTER TABLE `address_ship`
  ADD CONSTRAINT `FK_ADDRESS_USER` FOREIGN KEY (`Id_address_ship`) REFERENCES `users` (`Id_user`);

--
-- Các ràng buộc cho bảng `bookings`
--
ALTER TABLE `bookings`
  ADD CONSTRAINT `FK_BOOKING_STORE` FOREIGN KEY (`Id_store`) REFERENCES `stores` (`Id_store`),
  ADD CONSTRAINT `FK_BOOKING_STYLIST` FOREIGN KEY (`Id_stylist`) REFERENCES `users` (`Id_user`),
  ADD CONSTRAINT `FK_BOOKING_USER` FOREIGN KEY (`Id_user`) REFERENCES `users` (`Id_user`);

--
-- Các ràng buộc cho bảng `booking_detail`
--
ALTER TABLE `booking_detail`
  ADD CONSTRAINT `FK_BKD_BOOKING` FOREIGN KEY (`Id_booking`) REFERENCES `bookings` (`Id_booking`),
  ADD CONSTRAINT `FK_BKD_COMBO` FOREIGN KEY (`Id_combo`) REFERENCES `combos` (`Id_combo`),
  ADD CONSTRAINT `FK_BKD_SERVICE` FOREIGN KEY (`Id_services`) REFERENCES `services` (`Id_services`);

--
-- Các ràng buộc cho bảng `booking_rating`
--
ALTER TABLE `booking_rating`
  ADD CONSTRAINT `FK_Rate_BKD` FOREIGN KEY (`Id_booking_detail`) REFERENCES `booking_detail` (`Id_Booking_detail`),
  ADD CONSTRAINT `FK_Rate_User` FOREIGN KEY (`Id_user`) REFERENCES `users` (`Id_user`);

--
-- Các ràng buộc cho bảng `booking_result_images`
--
ALTER TABLE `booking_result_images`
  ADD CONSTRAINT `FK_Image_booking` FOREIGN KEY (`Id_booking`) REFERENCES `bookings` (`Id_booking`);

--
-- Các ràng buộc cho bảng `combo_detail`
--
ALTER TABLE `combo_detail`
  ADD CONSTRAINT `FK_COMBO` FOREIGN KEY (`Id_combo`) REFERENCES `combos` (`Id_combo`),
  ADD CONSTRAINT `FK_SERVICE` FOREIGN KEY (`Id_services`) REFERENCES `services` (`Id_services`);

--
-- Các ràng buộc cho bảng `favorite_products`
--
ALTER TABLE `favorite_products`
  ADD CONSTRAINT `FK_FVR_PRO` FOREIGN KEY (`Id_product`) REFERENCES `products` (`Id_product`),
  ADD CONSTRAINT `FK_FVR_USER` FOREIGN KEY (`Id_user`) REFERENCES `users` (`Id_user`);

--
-- Các ràng buộc cho bảng `image_products`
--
ALTER TABLE `image_products`
  ADD CONSTRAINT `FK_IMAGE_PRODUCT` FOREIGN KEY (`Id_product`) REFERENCES `products` (`Id_product`);

--
-- Các ràng buộc cho bảng `news`
--
ALTER TABLE `news`
  ADD CONSTRAINT `FK_NEWS_CATE` FOREIGN KEY (`Id_category_news`) REFERENCES `category_news` (`Id_category_news`);
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
