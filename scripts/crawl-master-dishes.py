#!/usr/bin/env python3
# -*- coding: utf-8 -*-
import os
import re
import json
import time
import urllib.request
import urllib.parse
from concurrent.futures import ThreadPoolExecutor, as_completed

DISH_MASTER_LIST = [
  # Category 1: Gỏi / Salad
  {"name": 'Khổ Qua Chà Bông "Sung Sướng"', "query": "khổ qua chà bông", "slug": "kho-qua-cha-bong"},
  {"name": "Nộm Sứa Hải Hậu", "query": "nộm sứa tai heo", "slug": "nom-sua-hai-hau"},
  {"name": "Salad Thăn Ngoại Xông Khói Sốt Chanh Leo", "query": "salad thịt bò xông khói", "slug": "salad-than-ngoai-xong-khoi"},
  {"name": "Salad Rong Biển Trứng Sốt Mè Rang", "query": "salad rong biển sốt mè rang", "slug": "salad-rong-bien-trung"},
  {"name": "Somtum Hải Sản", "query": "somtum hải sản thái lan", "slug": "somtum-hai-san"},
  {"name": 'Gỏi Xoài Cá Lăng "Trống Đồng"', "query": "gỏi xoài cá chiên giòn", "slug": "goi-xoai-ca-lang"},
  {"name": "Gỏi Má Heo Sốt Namchimcheo", "query": "má heo nướng sốt thái", "slug": "goi-ma-heo-namchimcheo"},
  {"name": "Nộm Rau Má Bắp Bò", "query": "nộm rau má bắp bò", "slug": "nom-rau-ma-bap-bo"},
  {"name": "Gỏi Bò Bóp Thấu", "query": "gỏi bò bóp thấu", "slug": "goi-bo-bop-thau"},
  {"name": 'Gỏi Bò "Trống Đồng"', "query": "gỏi bò tái chanh rau thơm", "slug": "goi-bo-trong-dong"},
  {"name": "Salad Cá Hồi Áp Chảo Sốt Chanh Leo", "query": "salad cá hồi sốt chanh leo", "slug": "salad-ca-hoi-chanh-leo"},

  # Category 2: Sashimi Tươi Sống
  {"name": "Thuyền Sashimi Tổng Hợp", "query": "thuyền sashimi tổng hợp", "slug": "thuyen-sashimi-tong-hop"},
  {"name": "Sashimi Cá Trích Ép Trứng", "query": "sashimi cá trích ép trứng", "slug": "sashimi-ca-trich-ep-trung"},
  {"name": "Sashimi Cá Hồi", "query": "sashimi cá hồi tươi", "slug": "sashimi-ca-hoi"},

  # Category 3: Khai Đạo & Nhâm Nhi
  {"name": "Cá Trứng Chiên Giòn Sốt Me", "query": "cá trứng chiên giòn sốt me", "slug": "ca-trung-chien-gion-sot-me"},
  {"name": "Đậu Tẩm Hành Hà Thành", "query": "đậu rán tẩm hành", "slug": "dau-tam-hanh-ha-thanh"},
  {"name": "Khoai Lang Kén Mật Ong", "query": "khoai lang kén chiên", "slug": "khoai-lang-ken-mat-ong"},
  {"name": "Đậu Hũ Xóc Sả Ớt", "query": "đậu phụ chiên sả ớt", "slug": "dau-hu-xoc-sa-ot"},
  {"name": "Khoai Tây Chiên Lắc Phomai", "query": "khoai tây lắc phô mai", "slug": "khoai-tay-chien-lac-phomai"},
  {"name": "Nấm Hải Sản Xóc Muối Tomyum", "query": "nấm hải sản chiên giòn", "slug": "nam-hai-san-xoc-muoi-tomyum"},
  {"name": "Đậu Hũ Sốt Tứ Xuyên", "query": "đậu phụ sốt tứ xuyên mapo", "slug": "dau-hu-sot-tu-xuyen"},
  {"name": "Ghẹ Sữa Rim Tỏi Ớt", "query": "ghẹ sữa rim me tỏi ớt", "slug": "ghe-sua-rim-toi-ot"},
  {"name": "Thăn Ngoại Xông Khói Sốt Hồng", "query": "thịt bò hun khói", "slug": "than-ngoai-xong-khoi-sot-hong"},
  {"name": "Trâu Xé Tay", "query": "thịt trâu gác bếp xé", "slug": "trau-xe-tay"},
  {"name": "Bắp Bò Xông Mầm Cuộn Cải Xanh", "query": "bắp bò cuộn cải xanh", "slug": "bap-bo-xong-mam-cuon-cai"},
  {"name": "Sụn Gà Rang Muối Hồng Kông", "query": "sụn gà rang muối", "slug": "sun-ga-rang-muoi-hk"},
  {"name": "Khô Mực Xé Tay", "query": "mực nướng xé sợi", "slug": "kho-muc-xe-tay"},
  {"name": "Dồi Sụn Sốt Xí Muội", "query": "dồi sụn nướng than", "slug": "doi-sun-sot-xi-muoi"},
  {"name": "Hến Xúc Phồng Tôm", "query": "hến xào xúc bánh đa", "slug": "hen-xuc-phong-tom"},
  {"name": "Chả Ốc Tây Hồ", "query": "chả ốc nướng lá lốt", "slug": "cha-oc-tay-ho"},
  {"name": "Lườn Vây Cá Hồi Xóc Muối HK", "query": "lườn cá hồi chiên giòn", "slug": "luon-vay-ca-hoi-xoc-muoi"},
  {"name": "Lườn Vây Cá Hồi Chiên Nước Mắm", "query": "lườn cá hồi chiên nước mắm", "slug": "luon-vay-ca-hoi-chien-mam"},
  {"name": "Khô Cá Lim Kim Cháy Mắm Tỏi", "query": "cá chỉ vàng rim tỏi ớt", "slug": "kho-ca-lim-kim-chay-mam"},
  {"name": "Cồi Điệp Xào Bắp Bơ", "query": "cồi sò điệp xào bơ tỏi", "slug": "coi-diep-xao-bap-bo"},
  {"name": "Sò Gạo Xúc Phồng Tôm", "query": "sò huyết xào tỏi", "slug": "so-gao-xuc-phong-tom"},
  {"name": "Lưỡi Vịt Sapo + Bánh Mỳ", "query": "lưỡi vịt sapo phá lấu", "slug": "luoi-vit-sapo-banh-my"},
  {"name": "Gà Bay Pháp Xúc Phồng Tôm", "query": "chim bồ câu băm xúc bánh đa", "slug": "ga-bay-phap-xuc-phong-tom"},
  {"name": "Bò Tơ Tái Chanh", "query": "bò tái chanh", "slug": "bo-to-tai-chanh"},

  # Category 4: Set Tổng Hợp
  {"name": "Set Nướng Mỹ Vị Trống Đồng", "query": "set thịt nướng bbq", "slug": "set-nuong-my-vi-trong-dong"},
  {"name": "Set Thịt Nguội Tổng Hợp", "query": "đĩa thịt nguội phô mai cold cut", "slug": "set-thit-nguoi-tong-hop"},

  # Category 5: Bò & Trâu Thượng Hạng
  {"name": "Thăn Ngoại Bò Mỹ Sốt Đặc Biệt", "query": "bò bít tết sốt tiêu đen", "slug": "than-ngoai-bo-my-sot-dac-biet"},
  {"name": "Bò Lúc Lắc Khoai Tây Chiên", "query": "bò lúc lắc khoai tây", "slug": "bo-luc-lac-khoai-tay-chien"},
  {"name": "Trâu Cháy Tỏi", "query": "thịt trâu xào tỏi", "slug": "trau-chay-toi"},
  {"name": "Trâu Cháy Tiêu Xanh", "query": "thịt trâu xào tiêu xanh", "slug": "trau-chay-tieu-xanh"},
  {"name": "Bò Tơ Cháy Tỏi", "query": "thịt bò xào tỏi đĩa", "slug": "bo-to-chay-toi"},
  {"name": "Bò Cháy Tỏi Phán Gang", "query": "bò né chảo gang", "slug": "bo-chay-toi-phan-gang"},
  {"name": "Bò Tơ Chao Lá Mắc Mật", "query": "bò chao lá móc mật", "slug": "bo-to-chao-la-mac-mat"},
  {"name": "Thăn Bò Mỹ Áp Chảo Sốt Teriyaki", "query": "thăn bò áp chảo sốt teriyaki", "slug": "than-bo-my-ap-chao-teriyaki"},

  # Category 6: Gà Đồi & Chim Bay
  {"name": "Cánh Gà Chiên Nước Mắm", "query": "cánh gà chiên nước mắm", "slug": "canh-ga-chien-nuoc-mam"},
  {"name": "Gà Quay Lu", "query": "gà nướng lu vàng", "slug": "ga-quay-lu"},
  {"name": "Gà Bay Pháp Quay", "query": "chim bồ câu quay", "slug": "ga-bay-phap-quay"},
  {"name": "Chân Gà Sốt Cay Hàn Quốc", "query": "chân gà rút xương sốt cay", "slug": "chan-ga-sot-cay-hq"},
  {"name": "Cánh Gà Sốt Cay Hàn Quốc", "query": "cánh gà sốt cay hàn quốc", "slug": "canh-ga-sot-cay-hq"},
  {"name": "Gà Ri Rang Muối", "query": "gà ta rang muối", "slug": "ga-ri-rang-muoi"},
  {"name": "Gà Chiên Mắm", "query": "gà chiên nước mắm", "slug": "ga-chien-mam"},
  {"name": "Cánh Gà Nướng Muối Xanh", "query": "cánh gà nướng muối ớt xanh", "slug": "canh-ga-nuong-muoi-xanh"},
  {"name": "Cánh Gà Nướng Muối Ớt", "query": "cánh gà nướng muối ớt", "slug": "canh-ga-nuong-muoi-ot"},
  {"name": "Gà Xào Cay Tứ Xuyên", "query": "gà xào cay tứ xuyên", "slug": "ga-xao-cay-tu-xuyen"},
  {"name": "Gà Bay Pháp Xào Cả", "query": "chim bồ câu xào sả ớt", "slug": "ga-bay-phap-xao-ca"},

  # Category 7: Heo & Đảo Sườn Cay
  {"name": "Đảo Sườn Cay Kiểu Thái", "query": "sườn cay thái lan", "slug": "dao-suon-cay-kieu-thai"},
  {"name": "Lão Trư Tắm Nắng Vườn Chanh", "query": "gỏi tai heo", "slug": "lao-tru-tam-nang-vuon-chanh"},
  {"name": "Thịt Dải Cháy Mắm Tỏi", "query": "thịt dải heo chiên mắm tỏi", "slug": "thit-dai-chay-mam-toi"},
  {"name": "Sườn Heo Chiên Tam Vị", "query": "sườn xào chua ngọt", "slug": "suon-heo-chien-tam-vi"},
  {"name": "Đuôi Lão Trư Rang Muối", "query": "đuôi heo chiên giòn", "slug": "duoi-lao-tru-rang-muoi"},
  {"name": "Đuôi Lão Trư Chiên Nước Mắm", "query": "đuôi heo chiên nước mắm", "slug": "duoi-lao-tru-chien-mam"},
  {"name": "Lão Trư Xào Cải Chua", "query": "dạ dày xào dưa chua", "slug": "lao-tru-xao-cai-chua"},
  {"name": "Lão Trư Xào Cay Tứ Xuyên", "query": "thịt heo xào cay", "slug": "lao-tru-xao-cay-tu-xuyen"},
  {"name": "Lão Trư Xào Nấm", "query": "thịt heo xào nấm tươi", "slug": "lao-tru-xao-nam"},
  {"name": "Giò Heo Muối Nổ Bì Da", "query": "chân giò muối chiên giòn", "slug": "gio-heo-muoi-no-bi-da"},

  # Category 8: Đặc Sản Ếch Đồng
  {"name": "Ếch Giòn Rang Muối", "query": "ếch rang muối lá lốt", "slug": "ech-gion-rang-muoi"},
  {"name": "Ếch Chiên Mắm", "query": "ếch chiên nước mắm", "slug": "ech-chien-mam"},
  {"name": "Ếch Xào Măng Cay", "query": "ếch xào măng cay", "slug": "ech-xao-mang-cay"},
  {"name": "Ếch Xào Cà Xanh", "query": "ếch xào cà đắng", "slug": "ech-xao-ca-xanh"},
  {"name": "Ếch Sapo + Bánh Mỳ", "query": "ếch kho tộ bánh mì", "slug": "ech-sapo-banh-my"},

  # Category 9: Hải Sản Cao Cấp
  {"name": "Ốc Hương Hoàng Kim + Bánh Mỳ", "query": "ốc hương sốt trứng muối bánh mì", "slug": "oc-huong-hoang-kim"},
  {"name": "Mực Trứng Chiên Mắm", "query": "mực trứng chiên nước mắm", "slug": "muc-trung-chien-mam"},
  {"name": "Tôm Nướng Mọi", "query": "tôm sú nướng than", "slug": "tom-nuong-moi"},
  {"name": "Tôm Nướng Muối Ớt", "query": "tôm nướng muối ớt", "slug": "tom-nuong-muoi-ot"},
  {"name": "Bạch Tuộc Xào Cay Tứ Xuyên", "query": "bạch tuộc xào cay", "slug": "bach-tuoc-xao-cay-tu-xuyen"},
  {"name": "Cá Hồi Áp Chảo Sốt Teriyaki", "query": "cá hồi áp chảo sốt teriyaki", "slug": "ca-hoi-ap-chao-teriyaki"},
  {"name": "Cá Hồi Áp Chảo Sốt Chanh Leo", "query": "cá hồi sốt chanh leo", "slug": "ca-hoi-ap-chao-chanh-leo"},
  {"name": "Cá Lóc Rang Muối Hồng Kông", "query": "cá lóc chiên xù giòn", "slug": "ca-loc-rang-muoi-hk"},
  {"name": "Cá Diêu Hồng Sốt Ớt Thái", "query": "cá diêu hồng chiên xù sốt thái", "slug": "ca-dieu-hong-sot-ot-thai"},
  {"name": "Ốc Hương Hấp Chanh Sả", "query": "ốc hương hấp sả", "slug": "oc-huong-hap-chanh-sa"},
  {"name": "Mực Ống Sốt Chanh Kiểu Thái", "query": "mực hấp sốt chanh thái lan", "slug": "muc-ong-sot-chanh-thai"},
  {"name": "Mực Trứng Chiên Lá Lốt", "query": "mực chiên lá lốt", "slug": "muc-trung-chien-la-lot"},
  {"name": "Cá Bò Da Nướng Muối Ớt Size Trung", "query": "cá bò da nướng muối ớt", "slug": "ca-bo-da-nuong-muoi-ot"},

  # Category 10: Nướng Thả Ga & Xiên Que
  {"name": "Hàu Bỏ Lò Phomai", "query": "hàu nướng phô mai", "slug": "hau-bo-lo-phomai"},
  {"name": "Hàu Nướng Mỡ Hành", "query": "hàu nướng mỡ hành đậu phộng", "slug": "hau-nuong-mo-hanh"},
  {"name": "Heo Nướng Xiên Mỹ Vị", "query": "thịt lợn xiên nướng than hoa", "slug": "heo-nuong-xien-my-vi"},
  {"name": "Thịt Dải Nướng Mật Ong", "query": "thịt dải heo nướng mật ong", "slug": "thit-dai-nuong-mat-ong"},
  {"name": "Sườn Cây Nướng Mật Ong", "query": "sườn cây nướng mật ong", "slug": "suon-cay-nuong-mat-ong"},
  {"name": "Xiên Gà Nướng Pattaya", "query": "thịt gà xiên que nướng satay", "slug": "xien-ga-nuong-pattaya"},
  {"name": "Xiên Heo Nướng Riềng Mẻ", "query": "thịt xiên nướng riềng mẻ", "slug": "xien-heo-nuong-rieng-me"},
  {"name": "Thịt Dải Nướng Ngũ Vị", "query": "thịt nướng ngũ vị", "slug": "thit-dai-nuong-ngu-vi"},
  {"name": "Thịt Dải Nướng Tê Cay", "query": "thịt xiên nướng cay sa tế", "slug": "thit-dai-nuong-te-cay"},
  {"name": "Xiên Bò Nướng Rau Củ", "query": "bò xiên nướng ớt chuông", "slug": "xien-bo-nuong-rau-cu"},
  {"name": "Ốc Hương Nướng Mọi", "query": "ốc hương nướng than hoa", "slug": "oc-huong-nuong-moi"},
  {"name": "Mực Nướng Muối Ớt", "query": "mực nướng muối ớt than hoa", "slug": "muc-nuong-muoi-ot"},

  # Category 11: Vườn Rau Sau Hè
  {"name": "Củ Quả Chấm Kho Quẹt", "query": "rau củ luộc chấm kho quẹt", "slug": "cu-qua-cham-kho-quet"},
  {"name": "Bí Nụ Cháy Tỏi", "query": "nụ bí xào tỏi", "slug": "bi-nu-chay-toi"},
  {"name": "Đậu Hũ Hải Sản Khói Lửa", "query": "đậu hũ khói lửa hải sản", "slug": "dau-hu-hai-san-khoi-lua"},
  {"name": "Dưa Chuột Chẻ", "query": "dưa chuột chẻ mát lạnh", "slug": "dua-chuot-che"},
  {"name": "Rau Muống Đỏ Lửa", "query": "rau muống xào tỏi xanh mướt", "slug": "rau-muong-do-lua"},
  {"name": "Cải Ngồng Xào Tỏi", "query": "cải ngồng xào tỏi", "slug": "cai-ngong-xao-toi"},
  {"name": "Đậu Que Xào Ruốc Tôm", "query": "đậu cô ve xào tôm", "slug": "dau-que-xao-ruoc-tom"},
  {"name": "Ngồng Tỏi Xào Bắp Bò", "query": "bắp bò xào ngồng tỏi", "slug": "ngong-toi-xao-bap-bo"},
  {"name": "Măng Trúc Xào Bắp Bò", "query": "bắp bò xào măng trúc", "slug": "mang-truc-xao-bap-bo"},

  # Category 12: Đổ Bê Tông (Cơm & Mỳ)
  {"name": "Cơm Chiên Hải Sản", "query": "cơm chiên hải sản", "slug": "com-chien-hai-san"},
  {"name": "Cơm Chiên Dưa Bò", "query": "cơm rang dưa bò", "slug": "com-chien-dua-bo"},
  {"name": "Pad Thái / Hủ Tiếu Xào Hải Sản", "query": "pad thái hải sản xào me", "slug": "pad-thai-hu-tieu-xao"},
  {"name": "Mỳ Xào Bò", "query": "mỳ xào bò rau cải ngọt", "slug": "my-xao-bo"},
  {"name": "Mỳ Xào Hải Sản", "query": "mỳ xào hải sản tôm mực", "slug": "my-xao-hai-san"},

  # Category 13: Giải Rượu & Canh Cháo
  {"name": "Cháo Hàu", "query": "cháo hàu sữa", "slug": "chao-hau"},
  {"name": "Canh Ngao Chua", "query": "canh ngao chua nấu dứa", "slug": "canh-ngao-chua"},
  {"name": "Canh Chua Thịt Băm", "query": "canh chua thịt băm", "slug": "canh-chua-thit-bam"},
  {"name": "Cháo Bò Băm", "query": "cháo thịt bò băm", "slug": "chao-bo-bam"},

  # Category 14: Đồ Uống (Bia Hơi & Giải Khát)
  {"name": "Bia Hơi Hà Nội (Tháp)", "query": "tháp bia hơi", "slug": "bia-hoi-ha-noi-thap"},
  {"name": "Bia Hơi Hà Nội (Cốc)", "query": "cốc bia hơi hà nội", "slug": "bia-hoi-ha-noi-coc"},
  {"name": "Bia Tươi Sao Vàng (Tháp)", "query": "tháp bia tươi", "slug": "bia-tuoi-sao-vang-thap"},
  {"name": "Bia Sao Vàng Gold", "query": "bia sao vàng lon", "slug": "bia-sao-vang-gold"},
  {"name": "Sao Vàng Ultra Light", "query": "bia sao vàng", "slug": "sao-vang-ultra-light"},
  {"name": "Heineken Bạc Lùn", "query": "bia heineken bạc lon", "slug": "heineken-bac-lun"},
  {"name": "Tiger Bạc Lùn", "query": "bia tiger crystal lon", "slug": "tiger-bac-lun"},
  {"name": "Nước Suối Tinh Khiết", "query": "chai nước khoáng aquafina", "slug": "nuoc-suoi-tinh-khiet"},
  {"name": "Pepsi Lon", "query": "lon pepsi", "slug": "pepsi-lon"},
  {"name": "Twister Cam Lon", "query": "lon nước cam twister", "slug": "twister-cam-lon"},
  {"name": "7UP Lon", "query": "lon nước ngọt 7up", "slug": "7up-lon"},
  {"name": "Nước Tăng Lực Redbull", "query": "lon bò húc redbull", "slug": "nuoc-tang-luc-redbull"},

  # Category 15: Món Gọi Thêm
  {"name": "Phồng Tôm Giòn Tan", "query": "bánh phồng tôm chiên giòn", "slug": "phong-tom-gion-tan"},
  {"name": "Lạc Sấy", "query": "lạc rang muối", "slug": "lac-say"},
  {"name": "Ruốc Bông", "query": "ruốc thịt heo", "slug": "ruoc-bong"},
  {"name": "Đĩa Rau Sashimi Tổng Hợp", "query": "rau tía tô sashimi", "slug": "dia-rau-sashimi-tong-hop"},
  {"name": "Khăn Lạnh Cao Cấp", "query": "khăn ướt nhà hàng", "slug": "khan-lanh-cao-cap"},
]

HEADERS = {
  'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
}

BLOCKLIST = [
  'wallpaper', 'hinh-nen', 'o-nhiem', 'phucanh', 'demoda', 'thuthuat',
  'may-tinh', 'laptop', 'dienthoai', 'xe-may', 'o-to', 'bat-dong-san',
  'game', 'anime', 'facebook', 'tiktok', 'shopee', 'lazada', 'icon',
  'vector', 'logo', 'banner', 'geographyrealm', 'longphuong', 'dantri',
  'antimatter', 'taimienphi', 'sohanews', 'wikitruyen', 'timtour', 'dichtiengnhat'
]

OUTPUT_DIR = os.path.abspath('public/dishes')
os.makedirs(OUTPUT_DIR, exist_ok=True)

def crawl_item(item):
    name = item["name"]
    query = item["query"]
    slug = item["slug"]
    target_filename = f"{slug}.jpg"
    target_path = os.path.join(OUTPUT_DIR, target_filename)

    url = 'https://www.bing.com/images/search?q=' + urllib.parse.quote(query) + '&form=HDRSC2&first=1'
    req = urllib.request.Request(url, headers=HEADERS)

    try:
        with urllib.request.urlopen(req, timeout=12) as resp:
            html = resp.read().decode('utf-8', errors='ignore')
        murls = re.findall(r'murl&quot;:&quot;(https?://[^&]+)&quot;', html)
        
        valid_candidates = []
        for u in murls:
            low = u.lower()
            if any(b in low for b in BLOCKLIST):
                continue
            if not any(ext in low for ext in ['.jpg', '.jpeg', '.png', '.webp']):
                continue
            valid_candidates.append(u)

        for img_url in valid_candidates[:12]:
            try:
                img_req = urllib.request.Request(img_url, headers=HEADERS)
                with urllib.request.urlopen(img_req, timeout=8) as img_resp:
                    content_type = img_resp.headers.get('Content-Type', '').lower()
                    if 'image' not in content_type and 'octet-stream' not in content_type:
                        continue
                    data = img_resp.read()
                    if len(data) < 15000:
                        continue
                    
                    with open(target_path, 'wb') as f:
                        f.write(data)
                    
                    return {"name": name, "status": "ok", "url": f"/dishes/{target_filename}", "bytes": len(data), "source": img_url}
            except Exception:
                continue
    except Exception as e:
        return {"name": name, "status": "error", "error": str(e), "url": None}

    return {"name": name, "status": "failed", "url": None}

def main():
    print(f"=== BẮT ĐẦU CÀO ẢNH CHUẨN XÁC DỰA TRÊN TÊN ẨM THỰC THỰC TẾ ({len(DISH_MASTER_LIST)} món) ===")
    results = {}
    success_count = 0

    with ThreadPoolExecutor(max_workers=5) as executor:
        future_map = {executor.submit(crawl_item, it): it for it in DISH_MASTER_LIST}
        for idx, fut in enumerate(as_completed(future_map), 1):
            it = future_map[fut]
            try:
                res = fut.result()
                results[res["name"]] = res["url"]
                if res["url"]:
                    success_count += 1
                    domain = urllib.parse.urlparse(res["source"]).netloc
                    print(f"[{idx:3d}/{len(DISH_MASTER_LIST)}] ✓ {it['name']} (Tìm: '{it['query']}') -> {res['url']} ({res['bytes'] // 1024} KB) [{domain}]")
                else:
                    print(f"[{idx:3d}/{len(DISH_MASTER_LIST)}] ✗ {it['name']} (Tìm: '{it['query']}') -> Thất bại")
            except Exception as e:
                print(f"[{idx:3d}/{len(DISH_MASTER_LIST)}] ! {it['name']} error: {e}")

    with open('scripts/dish-images-map.json', 'w', encoding='utf-8') as f:
        json.dump(results, f, ensure_ascii=False, indent=2)

    print(f"\n=== HOÀN TẤT: {success_count}/{len(DISH_MASTER_LIST)} MÓN ĐÃ CÀO THÀNH CÔNG ===")

if __name__ == '__main__':
    main()
