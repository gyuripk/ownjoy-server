# Data Modeling & Pipeline

Topic: Business
Archive: No
Areas: Product (https://app.notion.com/p/Product-1b0258c1a3bf80ecaf0ceee894312846?pvs=21)

<aside>

[Untitled](Data%20Modeling%20&%20Pipeline/Untitled%2037d258c1a3bf80b38d7dd097d0e84b48.csv)

</aside>

# JSON Data

## **행정안전부-CCTV정보 조회서비스**

[https://www.data.go.kr/data/15155042/openapi.do](https://www.data.go.kr/data/15155042/openapi.do)

- CCTV정보 데이터는 교통정보, 범죄예방 등의 공공목적용으로 실외에 설치된 CCTV 데이터로 관리기관명, 설치위치, 설치목적, 카메라대수 등의 데이터로 설치목적 구분, 소재지 주소 및 위·경도 기반 위치 정보와 함께 카메라 대수, 화소수, 촬영방면 등 장비 특성 정보와 설치연월, 관리기관명·연락처 등 관리 정보를 제공합니다.
  - 공공데이터 제공 표준 기준, 전국 자치단체에서 관리하는 CCTV 정보를 일괄 취합하여 전국 데이터로 제공
  - 자료는 동일한 서식과 용어로 정리하여 CCTV정보를 일관되게 안내
  - 해당 데이터에 대한 추가적인 자료 요청시 지자체 및 소관기관 담당자에게 문의
  - 해당 데이터 법령 소관기관 및 문의처 : 개인정보보호위원회 신기술개인정보과 / 02-2100-3064
  - 좌표계 : WGS(World Geodetic System)84 위경도좌표계 사용

```json
- Data : JSON+XML
- WGS84
[ Base URL: apis.data.go.kr/1741000/cctv_info ]
https://apis.data.go.kr/1741000/cctv_info/info?serviceKey=956a80391f9e00e0e00fcea70f9ed7ab75d3c8fc36fd7b8b65f283de3e5f3ee6&pageNo=1&numOfRows=1

{
  "response": {
    "body": {
      "dataType": "JSON",
      "items": {
        "item": [
          {
            "CAM_CNTOM": "3",
            "CAM_PIXEL_CNT": "200",
            "DAT_CRTR_YMD": "2026-06-30",
            "DAT_UPDT_PNT": "2026-05-27 22:58:19",
            "DAT_UPDT_SE": "",
            "INSTL_PRPS_SE_NM": "생활방범",
            "INSTL_YM": "2022-08",
            "KPNG_DAY_CNT": "30",
            "LAST_MDFCN_PNT": "2026-05-26 09:08:44",
            "LCTN_LOTNO_ADDR": "전북특별자치도 고창군 상하면 하장리 952-2",
            "LCTN_ROAD_NM_ADDR": "전북특별자치도 고창군 상하면 하장리 952-2",
            "MNG_INST_NM": "전북특별자치도 고창군",
            "MNG_INST_TELNO": "063-563-2790",
            "MNG_NO": "202647810000800409",
            "OPN_ATMY_GRP_CD": "4781000",
            "SHT_ANGLE_INFO": "360도전방면",
            "WGS84_LAT": "35.44346619",
            "WGS84_LOT": "126.4923304"
          }
        ]
      },
      "numOfRows": 1,
      "pageNo": 1,
      "totalCount": 375199
    },
    "header": {
      "resultCode": "0",
      "resultMsg": "정상"
    }
  }
}

```

## 스마트가로등 (street lights)

[https://www.data.go.kr/data/15028205/standard.do](https://www.data.go.kr/data/15028205/standard.do)

cctv와 다양한 센서가 장착되어 자동 또는 원격으로 관리되는 스마트가로등에 대한 정보(LED 조명, 자동조도제어, 무선인터넷 중계, 비콘, Wifi 기능 등 탑재) \*항목명: 스마트가로등유형,시도명,시군구명,도로명,소재지도로명주소,소재지지번주소,위도,경도,스마트가로등형태,점등상태여부,센서종류,센싱정보서비스,CCTV유무,WiFi유무,GPS수신기유무,비콘유무,조명제어여부,위급상황신고가능여부,앱서비스명,앱서비스제공내용,기타서비스,설치연도,관리기관명,관리기관전화번호

```json
- Data: JSON/xml
- WGS84

요청주소 https://api.data.go.kr/openapi/tn_pubr_public_smart_streetlight_api
https://api.data.go.kr/openapi/tn_pubr_public_smart_streetlight_api?serviceKey=956a80391f9e00e0e00fcea70f9ed7ab75d3c8fc36fd7b8b65f283de3e5f3ee6&type=json&numOfRows=1

{
  "response": {
    "header": {
      "resultCode": "00",
      "resultMsg": "NORMAL_SERVICE",
      "type": "json"
    },
    "body": {
      "items": [
        {
          "streetLampType": "2",
          "ctprvnNm": "경기도",
          "signguNm": "가평군",
          "roadNm": "자잠로",
          "rdnmadr": "",
          "lnmadr": "경기도 가평군 설악면 신천리 503-11",
          "latitude": "37.68080876",
          "longitude": "127.4928406",
          "streetLampStle": "1",
          "lghtUsgsttYn": "Y",
          "sensorKnd": "조도센서",
          "sensingInfoSvc": "방범",
          "cctvYn": "N",
          "wifiYn": "Y",
          "gpsYn": "Y",
          "beaconYn": "N",
          "lghtCtrlYn": "Y",
          "emrgncSttemntPosblYn": "N",
          "appSvcNm": "네브레이코리아",
          "appSvcCn": "",
          "etcSvc": "",
          "installationYear": "2016",
          "institutionNm": "경기도 가평군청",
          "phoneNumber": "031-580-2100",
          "referenceDate": "2025-05-26",
          "insttCode": "4160000",
          "insttNm": "경기도 가평군"
        }
      ],
      "totalCount": "12714",
      "numOfRows": "1",
      "pageNo": "1"
    }
  }
}
```

#### **요청변수(Request Parameter)**

| 항목명               | 샘플데이터 | 항목설명                           |
| -------------------- | ---------- | ---------------------------------- |
| pageNo               | 1          | 페이지 번호                        |
| numOfRows            | 100        | 한 페이지 결과 수 (최대 값 : 1000) |
| type                 | xml        | XML/JSON 여부                      |
| streetLampType       |            | 스마트가로등유형                   |
| ctprvnNm             |            | 시도명                             |
| signguNm             |            | 시군구명                           |
| roadNm               |            | 도로명                             |
| rdnmadr              |            | 소재지도로명주소                   |
| lnmadr               |            | 소재지지번주소                     |
| latitude             |            | 위도                               |
| longitude            |            | 경도                               |
| streetLampStle       |            | 스마트가로등형태                   |
| lghtUsgsttYn         |            | 점등상태여부                       |
| sensorKnd            |            | 센서종류                           |
| sensingInfoSvc       |            | 센싱정보서비스                     |
| cctvYn               |            | CCTV유무                           |
| wifiYn               |            | WiFi유무                           |
| gpsYn                |            | GPS수신기유무                      |
| beaconYn             |            | 비콘유무                           |
| lghtCtrlYn           |            | 조명제어여부                       |
| emrgncSttemntPosblYn |            | 위급상황신고가능여부               |
| appSvcNm             |            | 앱서비스명                         |
| appSvcCn             |            | 앱서비스제공내용                   |
| etcSvc               |            | 기타서비스                         |
| installationYear     |            | 설치년도                           |
| institutionNm        |            | 관리기관명                         |
| phoneNumber          |            | 관리기관전화번호                   |
| referenceDate        |            | 데이터기준일자                     |
| instt_code           |            | 제공기관코드                       |

#### **출력결과(Response Element)**

| 항목명               | 샘플데이터 | 항목설명             |
| -------------------- | ---------- | -------------------- |
| streetLampType       |            | 스마트가로등유형     |
| ctprvnNm             |            | 시도명               |
| signguNm             |            | 시군구명             |
| roadNm               |            | 도로명               |
| rdnmadr              |            | 소재지도로명주소     |
| lnmadr               |            | 소재지지번주소       |
| latitude             |            | 위도                 |
| longitude            |            | 경도                 |
| streetLampStle       |            | 스마트가로등형태     |
| lghtUsgsttYn         |            | 점등상태여부         |
| sensorKnd            |            | 센서종류             |
| sensingInfoSvc       |            | 센싱정보서비스       |
| cctvYn               |            | CCTV유무             |
| wifiYn               |            | WiFi유무             |
| gpsYn                |            | GPS수신기유무        |
| beaconYn             |            | 비콘유무             |
| lghtCtrlYn           |            | 조명제어여부         |
| emrgncSttemntPosblYn |            | 위급상황신고가능여부 |
| appSvcNm             |            | 앱서비스명           |
| appSvcCn             |            | 앱서비스제공내용     |
| etcSvc               |            | 기타서비스           |
| installationYear     |            | 설치년도             |
| institutionNm        |            | 관리기관명           |
| phoneNumber          |            | 관리기관전화번호     |
| referenceDate        |            | 데이터기준일자       |
| instt_code           |            | 제공기관코드         |

## 여성안심지킴이집

[https://www.data.go.kr/data/15034535/standard.do](https://www.data.go.kr/data/15034535/standard.do)

24시간 운영 편의점을 대상으로 도움이 필요한 여성이 대피해 비상벨을 누르면 경찰이 즉시 출동해 보호할 수 있도록 지정한 여성안심지킴이집에 대한 정보 \*항목명: 점포명,시도명,시군구명,시군구코드,소재지도로명주소,소재지지번주소,위도,경도,여성안심지킴이집전화번호,관할경찰서명,지정연도,운영여부

```json
- Data: JSON/XML
위치, 소재지 주소와 위·경도 기반 위치 정보
WGS84

요청주소 https://api.data.go.kr/openapi/tn_pubr_public_female_safety_prtchouse_api
https://api.data.go.kr/openapi/tn_pubr_public_female_safety_prtchouse_api?serviceKey=956a80391f9e00e0e00fcea70f9ed7ab75d3c8fc36fd7b8b65f283de3e5f3ee6**&type=json**&numOfRows=1

{
  "response": {
    "header": {
      "resultCode": "00",
      "resultMsg": "NORMAL_SERVICE",
      "type": "json"
    },
    "body": {
      "items": [
        {
          "storNm": "세븐일레븐 성내삼성점",
          "ctprvnNm": "서울특별시",
          "signguNm": "강동구",
          "signguCode": "11740",
          "rdnmadr": "서울특별시 강동구 성내로9길 35",
          "lnmadr": "서울특별시 강동구 성내동 534-7",
          "latitude": "37.5304459",
          "longitude": "127.1250701",
          "phoneNumber": "02-470-2149",
          "cmptncPolcsttnNm": "성내지구대",
          "appnYear": "",
          "useYn": "Y",
          "referenceDate": "2023-08-18",
          "insttCode": "3240000",
          "insttNm": "서울특별시 강동구"
        }
      ],
      "totalCount": "2838",
      "numOfRows": "1",
      "pageNo": "1"
    }
  }
}
```

#### **요청변수(Request Parameter)**

| 항목명           | 샘플데이터 | 항목설명                           |
| ---------------- | ---------- | ---------------------------------- |
| pageNo           | 1          | 페이지 번호                        |
| numOfRows        | 100        | 한 페이지 결과 수 (최대 값 : 1000) |
| type             | xml        | XML/JSON 여부                      |
| storNm           |            | 점포명                             |
| ctprvnNm         |            | 시도명                             |
| signguNm         |            | 시군구명                           |
| signguCode       |            | 시군구코드                         |
| rdnmadr          |            | 소재지도로명주소                   |
| lnmadr           |            | 소재지지번주소                     |
| latitude         |            | 위도                               |
| longitude        |            | 경도                               |
| phoneNumber      |            | 여성안심지킴이집전화번호           |
| cmptncPolcsttnNm |            | 관할경찰서명                       |
| appnYear         |            | 지정년도                           |
| useYn            |            | 운영여부                           |
| referenceDate    |            | 데이터기준일자                     |
| instt_code       |            | 제공기관코드                       |

#### **출력결과(Response Element)**

| 항목명           | 샘플데이터 | 항목설명                 |
| ---------------- | ---------- | ------------------------ |
| storNm           |            | 점포명                   |
| ctprvnNm         |            | 시도명                   |
| signguNm         |            | 시군구명                 |
| signguCode       |            | 시군구코드               |
| rdnmadr          |            | 소재지도로명주소         |
| lnmadr           |            | 소재지지번주소           |
| latitude         |            | 위도                     |
| longitude        |            | 경도                     |
| phoneNumber      |            | 여성안심지킴이집전화번호 |
| cmptncPolcsttnNm |            | 관할경찰서명             |
| appnYear         |            | 지정년도                 |
| useYn            |            | 운영여부                 |
| referenceDate    |            | 데이터기준일자           |
| instt_code       |            | 제공기관코드             |

## 전국안심택배함

[https://www.data.go.kr/data/15034534/standard.do](https://www.data.go.kr/data/15034534/standard.do)

범죄예방을 위해 공공장소에 설치된 무인택배함에 대한 정보 \*항목명: 시설명,시도명,시군구명,시군구코드,소재지도로명주소,소재지지번주소,위도,경도,평일운영시작시각,평일운영종료시각,토요일운영시작시각,토요일운영종료시각,공휴일운영시작시각,공휴일운영종료시각,무료이용시간,연체료부과단위시간,연체료,제어방식구분코드,사용방법설명,택배함종류코드,칸개수,칸깊이,칸너비,칸높이,설치일자,고객센터전화번호,관리기관명,관리기관전화번호

```json
- Data: JSON/XML
위치, 소재지 주소와 위·경도 기반 위치 정보
WGS84

요청주소 https://api.data.go.kr/openapi/tn_pubr_public_female_safety_hdrycstdyplace_api
https://api.data.go.kr/openapi/tn_pubr_public_female_safety_hdrycstdyplace_api?serviceKey=956a80391f9e00e0e00fcea70f9ed7ab75d3c8fc36fd7b8b65f283de3e5f3ee6&type=json&numOfRows=1

{
  "response": {
    "header": {
      "resultCode": "00",
      "resultMsg": "NORMAL_SERVICE",
      "type": "json"
    },
    "body": {
      "items": [
        {
          "fcltyNm": "북삼인평체육공원 무인택배함",
          "ctprvnNm": "경상북도",
          "signguNm": "칠곡군",
          "signguCode": "52200",
          "rdnmadr": "경상북도 칠곡군 북삼읍 북삼로 65",
          "lnmadr": "경상북도 칠곡군 북삼읍 인평리 46",
          "latitude": "36.0726696",
          "longitude": "128.3409003",
          "weekdayOperOpenHhmm": "00:00",
          "weekdayOperColseHhmm": "23:59",
          "satOperOperOpenHhmm": "00:00",
          "satOperCloseHhmm": "23:59",
          "holidayOperOpenHhmm": "00:00",
          "holidayCloseOpenHhmm": "23:59",
          "freeUseTime": "0",
          "arrsUnitTime": "0",
          "arrs": "0",
          "ctrlMthdCode": "01",
          "useRecovryMthDc": "물품 배송 시 휴대폰 문자로 전송되는 택배보관함번호, 인증번호를 확인하여, 해당 보관함에서 본인 휴대폰 번호와 전송받은 인증번호를 입력한 뒤 보관함을 열어 물품 수령",
          "hdryboxKnd": "대형/01+중형/02+중소형/03+소형/04",
          "boxCo": "01/01+02/04+03/05+04/09",
          "boxDp": "01/60+02/60+03/60+04/60",
          "boxBt": "01/50+02/50+03/50+04/50",
          "boxHg": "01/60+02/45+03/36+04/30",
          "instlDate": "2017-05-05",
          "cstmrCnterPhoneNumber": "1688-1186",
          "institutionNm": "경상북도 칠곡군청",
          "institutionPhoneNumber": "054-979-6443",
          "referenceDate": "2025-12-21",
          "insttCode": "5220000",
          "insttNm": "경상북도 칠곡군"
        }
      ],
      "totalCount": "816",
      "numOfRows": "1",
      "pageNo": "1"
    }
  }
}

```

#### **요청변수(Request Parameter)**

| 항목명                 | 샘플데이터 | 항목설명                           |
| ---------------------- | ---------- | ---------------------------------- |
| pageNo                 | 1          | 페이지 번호                        |
| numOfRows              | 100        | 한 페이지 결과 수 (최대 값 : 1000) |
| type                   | xml        | XML/JSON 여부                      |
| fcltyNm                |            | 시설명                             |
| ctprvnNm               |            | 시도명                             |
| signguNm               |            | 시군구명                           |
| signguCode             |            | 시군구코드                         |
| rdnmadr                |            | 소재지도로명주소                   |
| lnmadr                 |            | 소재지지번주소                     |
| **latitude**           |            | **위도**                           |
| **longitude**          |            | **경도**                           |
| weekdayOperOpenHhmm    |            | 평일운영시작시각                   |
| weekdayOperColseHhmm   |            | 평일운영종료시각                   |
| satOperOperOpenHhmm    |            | 토요일운영시작시각                 |
| satOperCloseHhmm       |            | 토요일운영종료시각                 |
| holidayOperOpenHhmm    |            | 공휴일운영시작시각                 |
| holidayCloseOpenHhmm   |            | 공휴일운영종료시각                 |
| freeUseTime            |            | 무료이용시간                       |
| arrsUnitTime           |            | 연체료부과단위시간                 |
| arrs                   |            | 연체료                             |
| ctrlMthdCode           |            | 제어방식구분코드                   |
| useRecovryMthDc        |            | 사용방법설명                       |
| hdryboxKnd             |            | 택배함종류코드                     |
| boxCo                  |            | 칸개수                             |
| boxDp                  |            | 칸깊이                             |
| boxBt                  |            | 칸너비                             |
| boxHg                  |            | 칸높이                             |
| instlDate              |            | 설치일자                           |
| cstmrCnterPhoneNumber  |            | 고객센터전화번호                   |
| institutionNm          |            | 관리기관명                         |
| institutionPhoneNumber |            | 관리기관전화번호                   |
| referenceDate          |            | 데이터기준일자                     |
| instt_code             |            | 제공기관코드                       |

#### **출력결과(Response Element)**

| 항목명                 | 샘플데이터 | 항목설명           |
| ---------------------- | ---------- | ------------------ |
| fcltyNm                |            | 시설명             |
| ctprvnNm               |            | 시도명             |
| signguNm               |            | 시군구명           |
| signguCode             |            | 시군구코드         |
| rdnmadr                |            | 소재지도로명주소   |
| lnmadr                 |            | 소재지지번주소     |
| latitude               |            | 위도               |
| longitude              |            | 경도               |
| weekdayOperOpenHhmm    |            | 평일운영시작시각   |
| weekdayOperColseHhmm   |            | 평일운영종료시각   |
| satOperOperOpenHhmm    |            | 토요일운영시작시각 |
| satOperCloseHhmm       |            | 토요일운영종료시각 |
| holidayOperOpenHhmm    |            | 공휴일운영시작시각 |
| holidayCloseOpenHhmm   |            | 공휴일운영종료시각 |
| freeUseTime            |            | 무료이용시간       |
| arrsUnitTime           |            | 연체료부과단위시간 |
| arrs                   |            | 연체료             |
| ctrlMthdCode           |            | 제어방식구분코드   |
| useRecovryMthDc        |            | 사용방법설명       |
| hdryboxKnd             |            | 택배함종류코드     |
| boxCo                  |            | 칸개수             |
| boxDp                  |            | 칸깊이             |
| boxBt                  |            | 칸너비             |
| boxHg                  |            | 칸높이             |
| instlDate              |            | 설치일자           |
| cstmrCnterPhoneNumber  |            | 고객센터전화번호   |
| institutionNm          |            | 관리기관명         |
| institutionPhoneNumber |            | 관리기관전화번호   |
| referenceDate          |            | 데이터기준일자     |
| instt_code             |            | 제공기관코드       |

## 보안등

[https://www.data.go.kr/data/15017320/standard.do#tab_layer_open](https://www.data.go.kr/data/15017320/standard.do#tab_layer_open)

「국민들의 안전한 생활환경 조성 및 편의 증진을 위하여 지방자치단체에서 관리하는 보안등에 관한 정보 \*항목명: 보안등위치명,설치개수,소재지도로명주소,소재지지번주소,위도,경도,설치연도,설치형태,관리기관전화번호,관리기관명

```json
- Data: JSON/XML
- **요청주소** https://api.data.go.kr/openapi/tn_pubr_public_scrty_lmp_api

https://api.data.go.kr/openapi/tn_pubr_public_scrty_lmp_api?serviceKey=956a80391f9e00e0e00fcea70f9ed7ab75d3c8fc36fd7b8b65f283de3e5f3ee6&pageNo=1&numOfRows=10**&type=json**

{
  "response": {
    "header": {
      "resultCode": "00",
      "resultMsg": "NORMAL_SERVICE",
      "type": "json"
    },
    "body": {
      "items": [
        {
          "lmpLcNm": "01-옥인6길15",
          "installationCo": "1",
          "rdnmadr": "서울특별시 종로구 옥인6길15",
          "lnmadr": "서울특별시 종로구 누상동 166-122",
          "latitude": "37.5814361",
          "longitude": "126.9645941",
          "installationYear": "",
          "installationType": "한전주",
          "phoneNumber": "02-2148-3193",
          "institutionNm": "서울특별시 종로구청 도로과",
          "referenceDate": "2023-08-23",
          "insttCode": "3000000",
          "insttNm": "서울특별시 종로구"
        }
      ],
      "totalCount": "1841235",
      "numOfRows": "1",
      "pageNo": "1"
    }
  }
}
```

#### **요청변수(Request Parameter)**

| 항목명            | 샘플데이터 | 항목설명                           |
| ----------------- | ---------- | ---------------------------------- |
| pageNo            | 1          | 페이지 번호                        |
| numOfRows         | 100        | 한 페이지 결과 수 (최대 값 : 1000) |
| type              | xml        | XML/JSON 여부                      |
| LMP_LC_NM         |            | 보안등위치명                       |
| INSTALLATION_CO   |            | 설치개수                           |
| RDNMADR           |            | 소재지도로명주소                   |
| LNMADR            |            | 소재지지번주소                     |
| LATITUDE          |            | 위도                               |
| LONGITUDE         |            | 경도                               |
| INSTALLATION_YEAR |            | 설치연도                           |
| INSTALLATION_TYPE |            | 설치형태                           |
| PHONE_NUMBER      |            | 관리기관전화번호                   |
| INSTITUTION_NM    |            | 관리기관명                         |
| REFERENCE_DATE    |            | 데이터기준일자                     |
| instt_code        |            | 제공기관코드                       |

#### **출력결과(Response Element)**

| 항목명            | 샘플데이터                   | 항목설명         |
| ----------------- | ---------------------------- | ---------------- |
| LMP_LC_NM         | 백운로                       | 보안등위치명     |
| INSTALLATION_CO   | 1                            | 설치개수         |
| RDNMADR           | 충청남도 공주시 백운로       | 소재지도로명주소 |
| LNMADR            | 충청남도 공주시 온천리 426-8 | 소재지지번주소   |
| LATITUDE          | 36.361997                    | 위도             |
| LONGITUDE         |                              | 경도             |
| INSTALLATION_YEAR | 2000                         | 설치연도         |
| INSTALLATION_TYPE | 한전주                       | 설치형태         |
| PHONE_NUMBER      | 041-840-8563                 | 관리기관전화번호 |
| INSTITUTION_NM    | 충청남도 공주시              | 관리기관명       |
| REFERENCE_DATE    | 2020-10-29                   | 데이터기준일자   |
| instt_code        | 4500000                      | 제공기관코드     |

## **행정안전부: 안전비상벨위치정보 조회서비스 (공공데이터 포털)**

[https://www.data.go.kr/data/15155046/openapi.do?recommendDataYn=Y](https://www.data.go.kr/data/15155046/openapi.do?recommendDataYn=Y) -

안전비상벨위치정보 데이터는 도시재정비 촉진을 위한 특별법 등에 따라 범죄예방대첵의 일환으로 설치되는 안전비상벨에 대한 데이터로 설치목적, 설치장소 유형 및 위치, 소재지 주소와 위·경도 기반 위치 정보 등 기본 정보와 경찰·경비업체·관리사무소 연계 유무와 부가기능, 점검 이력, 관리기관명·연락처 등 관리 정보를 제공합니다.

- 공공데이터 제공 표준 기준, 전국 자치단체에서 관리하는 안전비상벨위치정보를 일괄 취합하여 전국 데이터로 제공
- 자료는 동일한 서식과 용어로 정리하여 안전비상벨위치정보를 일관되게 안내
- 해당 데이터에 대한 추가적인 자료 요청시 지자체 및 소관기관 담당자에게 문의
- 해당 데이터 법령 소관기관 및 문의처 : 국토교통부 주택정비과 / 044-201-3391
- 좌표계 : 보정계수 안들어간 Bessel 중부원점TM(EPSG:5174)

```json
- Data: JSON+XML
위치, 소재지 주소와 위·경도 기반 위치 정보
- [ Base URL: [https://www.data.go.kr/](https://www.data.go.kr/data/15155046/openapi.do?recommendDataYn=Y)apis.data.go.kr/1741000/emergency_call_box_info ]
https://apis.data.go.kr/1741000/emergency_call_box_info/info?serviceKey=956a80391f9e00e0e00fcea70f9ed7ab75d3c8fc36fd7b8b65f283de3e5f3ee6

{
  "response": {
    "body": {
      "dataType": "JSON",
      "items": {
        "item": [
          {
            "DAT_CRTR_YMD": "2026-06-26",
            "DAT_UPDT_PNT": "2026-05-15 18:45:46",
            "DAT_UPDT_SE": "I",
            "EXTRA_FWK": "",
            "INSTL_PLC_TYPE": "건물",
            "INSTL_PRPS": "기타",
            "INSTL_PSTN": "오수면사무소",
            "LAST_CHCK_RSLT_SE": "Y",
            "LAST_CHCK_YMD": "2025-10-29",
            "LAST_MDFCN_PNT": "2025-10-29 16:01:03",
            "LCTN_LOTNO_ADDR": "전북특별자치도 임실군 오수면 오수리 392-11 오수면 사무소",
            "LCTN_ROAD_NM_ADDR": "전북특별자치도 임실군 오수면 삼일로 27, 오수면 사무소",
            "LINK_MTH": "단방향",
            "MNGOFC_LINK_EN": "N",
            "MNG_INST_NM": "오수면사무소",
            "MNG_INST_TELNO": "063-640-4213",
            "MNG_NO": "202547610000900013",
            "OPN_ATMY_GRP_CD": "4761000",
            "POLC_LINK_EN": "Y",
            "SECCO_LINK_EN": "N",
            "SFTY_EMRGNCBLL_INSTL_YR": "2019",
            "SFTY_EMRGNCBLL_MNG_NO": "D32F20",
            "WGS84_LAT": "35.541315",
            "WGS84_LOT": "127.326913"
          }
        ]
      },
      "numOfRows": 1,
      "pageNo": 1,
      "totalCount": 88843
    },
    "header": {
      "resultCode": "0",
      "resultMsg": "정상"
    }
  }
}
```

## 행정안전부*CPTED*위치포인트

[https://www.safetydata.go.kr/disaster-data/view?dataSn=81](https://www.safetydata.go.kr/disaster-data/view?dataSn=81)

범죄예방환경설계(CPTED)의 약칭으로 도시계획 및 건축설계 시 범죄를 일으킬 수 있는 요소들을 제거하거나 최소화 시키는 일련의 노력과 과정들을 지칭하는 정보를 표시합니다

```json
- Data: JSON
X, Y 좌표값, GEOM 값 다 있음
- URL 주소	https://www.safetydata.go.kr/V2/api/DSSP-IF-00090?serviceKey=MH2NC3829BE1H7V9
- service Key = MH2NC3829BE1H7V9
죄예방환경설계(CPTED)의 약칭으로 도시계획 및 건축설계 시 범죄를 일으킬 수 있는 요소들을 제거하거나 최소화 시키는 일련의 노력과 과정들을 지칭하는 정보를 표시합니다

        String dataName = "데이터명";
        String serviceKey = "서비스키";
        String pageNo = "1";
        String numOfRows = "10";

        /* API를 호출하기 위한 URL 생성 */
        StringBuilder urlBuilder = new StringBuilder("https://www.safetydata.go.kr/V2/api/DSSP-IF-00090");
        /* API 키 */
        urlBuilder.append("?" + "serviceKey=" + serviceKey);
        /* 페이지 번호 */
        urlBuilder.append("&" + "pageNo=" + pageNo);
        /* 페이지당 데이터 수 */
        urlBuilder.append("&" + "numOfRows=" + numOfRows);

{
  "header": {
    "resultMsg": "NORMAL SERVICE",
    "resultCode": "00",
    "errorMsg": null
  },
  "numOfRows": 10,
  "pageNo": 1,
  "totalCount": 1597,
  "body": [
    {
      "DISTOFFICE_NM": "서울청",
      "POLSTN_NM": "서울용산경찰서",
      "LOTNO_ADDR": "서울특별시 용산구 용산동6가 69-170",
      "CHNRG_CMNT": "‘용산구 안심 지하보도’ 조성사업 완공",
      "CHNRG_DEPT_NM": "서울청 서울용산서",
      "CHNRG_NM": "박*현",
      "LPST_NM": "한강로지구대",
      "RGTR_DEPT_CD": "G30000001329352",
      "NTN_BRNCH_NO": "다사544466",
      "GEOM": "POINT(14135850 4511541)",
      "POLSTN_CD": "G30000001329352",
      "RPT_FILE_1": null,
      "DISTOFFICE_CD": "G30000001320252",
      "PRGRS_SITU": "완료",
      "RGTR_NM": "박*현",
      "DENG_YMD": "20200531",
      "CRIM_PRVN_ENVRN_DESIGN_DENG_TRGT": "공동주택",
      "LPST_CD": "G30000001336359",
      "RPT_FILE_2": null,
      "CHNRG_DEPT_CD": "G30000001329352",
      "DENG_KND": null,
      "RPT_FILE_CNT": "196",
      "RGTR_DEPT_NM": "서울청 서울용산서",
      "YMAP_CRTS": 4511541,
      "XMAP_CRTS": 14135850
    },
```

#### **요청변수(Request Parameter)**

| 항목명(국문)       | 항목명(영문) | 타입    | 항목크기 | 항목구분 | 항목설명           |
| ------------------ | ------------ | ------- | -------- | -------- | ------------------ |
| 서비스키           | serviceKey   | STRING  | 50       | Y        | 서비스키           |
| 페이지당개수       | numOfRows    | NUMBER  | 30       | N        | 페이지당개수       |
| 페이지번호         | pageNo       | NUMBER  | 30       | N        | 페이지번호         |
| 응답타입(json,xml) | returnType   | VARCHAR | 30       | N        | 응답타입(json,xml) |

#### **출력결과(Response Element)**

| 항목명(국문)               | 항목명(영문)                     | 타입 | 항목크기 | 항목구분 | 항목설명                   |
| -------------------------- | -------------------------------- | ---- | -------- | -------- | -------------------------- |
| 범죄예방환경설계디자인대상 | CRIM_PRVN_ENVRN_DESIGN_DENG_TRGT |      | 30       | Y        | 범죄예방환경설계디자인대상 |
| 디자인종류                 | DENG_KND                         |      | 256      | Y        | 디자인종류                 |
| 진행상황                   | PRGRS_SITU                       |      | 40       | Y        | 진행상황                   |
| 디자인일자                 | DENG_YMD                         |      | 20       | Y        | 디자인일자                 |
| 보고파일수                 | RPT_FILE_CNT                     |      | 10       | Y        | 보고파일수                 |
| 보고파일1                  | RPT_FILE_1                       |      | 80       | Y        | 보고파일1                  |
| 보고파일2                  | RPT_FILE_2                       |      | 80       | Y        | 보고파일2                  |
| 지구대코드                 | LPST_CD                          |      | 20       | Y        | 지구대코드                 |
| 지구대명                   | LPST_NM                          |      | 256      | Y        | 지구대명                   |
| 경찰서코드                 | POLSTN_CD                        |      | 20       | Y        | 경찰서코드                 |
| 경찰서명                   | POLSTN_NM                        |      | 256      | Y        | 경찰서명                   |
| 구청코드                   | DISTOFFICE_CD                    |      | 50       | Y        | 구청코드                   |
| 구청명                     | DISTOFFICE_NM                    |      | 256      | Y        | 구청명                     |
| 국가지점번호               | NTN_BRNCH_NO                     |      | 20       | Y        | 국가지점번호               |
| 지번주소                   | LOTNO_ADDR                       |      | 200      | Y        | 지번주소                   |
| 등록자명                   | RGTR_NM                          |      | 100      | Y        | 등록자명                   |
| 등록자부서코드             | RGTR_DEPT_CD                     |      | 20       | Y        | 등록자부서코드             |
| 등록자부서명               | RGTR_DEPT_NM                     |      | 200      | Y        | 등록자부서명               |
| 변경자명                   | CHNRG_NM                         |      | 100      | Y        | 변경자명                   |
| 변경자부서코드             | CHNRG_DEPT_CD                    |      | 20       | Y        | 변경자부서코드             |
| 변경자부서명               | CHNRG_DEPT_NM                    |      | 256      | Y        | 변경자부서명               |
| 변경자댓글                 | CHNRG_CMNT                       |      | 1000     | Y        | 변경자댓글                 |
| X지도좌표                  | XMAP_CRTS                        |      | 12       | Y        | X지도좌표                  |
| Y지도좌표                  | YMAP_CRTS                        |      | 13       | Y        | Y지도좌표                  |
| 지오메트리                 | GEOM                             |      |          | Y        | 지오메트리                 |

## **서울시 안심귀갓길 경로**

[https://data.seoul.go.kr/dataList/OA-21695/S/1/datasetView.do](https://data.seoul.go.kr/dataList/OA-21695/S/1/datasetView.do)

서울특별시에 위치한 362개의 안심귀갓길에 대한 **경로기반 링크 데이터**입니다.

안심귀갓길의 **노드와 노드를 연결**하는 **라인형태의 위치데이터** 입니다.

```json
- Data: JSON/XML
- SHP (geo data)
http://openapi.seoul.go.kr:8088/(**인증키**)/xml/tbSafeReturnRouteLink/1/5/

http://openapi.seoul.go.kr:8088/6e616f6e6a67756c31303478774e6e6f/**json**/tbSafeReturnRouteLink/1/5/
http://openapi.seoul.go.kr:8088/6e616f6e6a67756c31303478774e6e6f/**xml**/tbSafeReturnRouteLink/1/5/

{
  "tbSafeReturnRouteLink": {
    "list_total_count": 362,
    "RESULT": {
      "CODE": "INFO-000",
      "MESSAGE": "정상 처리되었습니다"
    },
    "row": [
      {
        "LINK_LEN": "305",
        "SGG_CODE": "1111000000",
        "SGG_NM": "서울특별시 종로구",
        "EMD_CODE": "1111011000",
        "EMD_NM": "누하동",
        "BELL_CNT": "4",
        "CCTV_CNT": "13",
        "BRD_CNT": "",
        "MARK_CNT": "5",
        "LAMP_CNT": "14",
        "SERVICE_SIGN_CNT": "",
        "DCLR_SIGN_CNT": "4",
        "ETC_FACI_CNT": "",
        "ASG_ID": "1111011000_04",
        "ASG_NM": "종로안심04",
        "ASG_DATE": "2015",
        "DELOC": "필운대로5길",
        "REMARK": "",
        "REFDATE": "20221109"
      }
    ]
  }
}
```

#### **요청인자**

| **변수명**  | **타입**      | **변수설명** | **값설명**                                                 |
| ----------- | ------------- | ------------ | ---------------------------------------------------------- |
| KEY         | String(필수)  | 인증키       | OpenAPI 에서 발급된 인증키                                 |
| TYPE        | String(필수)  | 요청파일타입 | xml : xml, xml파일 : xmlf, 엑셀파일 : xls, json파일 : json |
| SERVICE     | String(필수)  | 서비스명     | tbSafeReturnRouteLink                                      |
| START_INDEX | INTEGER(필수) | 요청시작위치 | 정수 입력 (페이징 시작번호 입니다 : 데이터 행 시작번호)    |
| END_INDEX   | INTEGER(필수) | 요청종료위치 | 정수 입력 (페이징 끝번호 입니다 : 데이터 행 끝번호)        |

#### **출력값**

| **No** | **출력명**       | **출력설명**                           |
| ------ | ---------------- | -------------------------------------- |
| 공통   | list_total_count | 총 데이터 건수 (정상조회 시 출력됨)    |
| 공통   | RESULT.CODE      | 요청결과 코드 (하단 메세지설명 참고)   |
| 공통   | RESULT.MESSAGE   | 요청결과 메시지 (하단 메세지설명 참고) |
| 1      | LINK_LEN         | 링크 길이                              |
| 2      | SGG_CODE         | 시군구 코드                            |
| 3      | SGG_NM           | 시군구명                               |
| 4      | EMD_CODE         | 읍면동 코드                            |
| 5      | EMD_NM           | 읍면동명                               |
| 6      | BELL_CNT         | 안심벨                                 |
| 7      | CCTV_CNT         | cctv                                   |
| 8      | BRD_CNT          | 안심귀갓길 안내표지판                  |
| 9      | MARK_CNT         | 안심귀갓길 노면표기                    |
| 10     | LAMP_CNT         | 보안등                                 |
| 11     | SERVICE_SIGN_CNT | 안심귀갓길 서비스 안내판               |
| 12     | DCLR_SIGN_CNT    | 112 위치신고 안내판                    |
| 13     | ETC_FACI_CNT     | 기타 시설물                            |
| 14     | ASG_ID           | 안심귀갓길 id                          |
| 15     | ASG_NM           | 안심귀갓길 명                          |
| 16     | ASG_DATE         | 조성년월                               |
| 17     | DELOC            | 세부위치 설명                          |
| 18     | REMARK           | 비고                                   |
| 19     | REFDATE          | 데이터기준일자                         |

| **안심귀갓길 경로 기반 링크 데이터**     |                                                                                  |                   |
| ---------------------------------------- | -------------------------------------------------------------------------------- | ----------------- |
| 항목명                                   | 설명                                                                             | 예시              |
| 링크 길이                                | 단위 : 미터(M)                                                                   |
| 숫자만 입력, 소수점 2자리, 단위까지 입력 | 26.68                                                                            |
| 시군구 코드                              | 십진수 10자리 (행정표준코드 참조)                                                | 1121500000        |
| 시군구명                                 |                                                                                  | 서울특별시 광진구 |
| 읍면동 코드                              | 십진수 10자리 (행정표준코드 참조)                                                | 1121510700        |
| 읍면동명                                 |                                                                                  | 화양동            |
| 안심벨                                   | 안심벨의 개수                                                                    | 1                 |
| CCTV                                     | CCTV의 개수                                                                      | 5                 |
| 안심귀갓길 안내표지판                    | 안내표지판의 개수                                                                |                   |
| 안심귀갓길 노면표기                      | 노면표기의 개수                                                                  |                   |
| 보안등                                   | 보안등의 개수                                                                    | 3                 |
| 안심귀갓길 서비스 안내판                 | 안심귀갓길 서비스 안내표지판 개수                                                |                   |
| 112 위치신고 안내판                      | 112 안내표지판 개수                                                              |                   |
| 기타 시설물                              | 기타 시설물 개수                                                                 |                   |
| 안심귀갓길 ID                            | 읍면동코드\_xx \*xx는 해당 안심귀갓길명 뒤에 붙은 숫자, 숫자 없을 시 임의로 생성 | 1121510700_01     |
| 안심귀갓길명                             |                                                                                  | 광진안심01        |
| 조성년월                                 | 숫자만 입력                                                                      | 2014              |
| 세부위치 설명                            |                                                                                  | 동일로24길        |
| 비고                                     | 특이사항                                                                         |                   |
| 데이터 기준일자                          | 현장조사일                                                                       | 20220727          |

## **서울시 안심귀갓길 서비스**

[https://data.seoul.go.kr/dataList/OA-21697/S/1/datasetView.do](https://data.seoul.go.kr/dataList/OA-21697/S/1/datasetView.do)

서울특별시에 위치한 362개의 안심귀갓길 인근에 위치한 **안전시설물** 데이터입니다.

안심택배함, 안심귀가길 지킴이집 등 안심귀갓길 서비스시설물을 가까운 **안심귀갓길과 연계**할 수 있도록 데이터를 구축하였습니다.

```json
- Data: JSON/XML
- SHP (geo data)

http://openapi.seoul.go.kr:8088/6e616f6e6a67756c31303478774e6e6f/xml/tbSafeReturnService/1/5/
http://openapi.seoul.go.kr:8088/6e616f6e6a67756c31303478774e6e6f/json/tbSafeReturnService/1/5/

{
  "tbSafeReturnService": {
    "list_total_count": 347,
    "RESULT": {
      "CODE": "INFO-000",
      "MESSAGE": "정상 처리되었습니다"
    },
    "row": [
      {
        "SERVICE_ID": "1111017400_06_S01",
        "SISUL_CODE": "402",
        "SGG_CODE": "1111000000",
        "SGG_NM": "서울특별시 종로구",
        "EMD_CODE": "1111016400",
        "EMD_NM": "종로6가",
        "INST_NM": "혜화경찰서",
        "INST_TELNO": "02-762-4400",
        "LONGITUDE": 127.00759,
        "LATITUDE": 37.573204,
        "DE_LOC": "서울특별시 종로구 율곡로 271",
        "WORK_DATE": "0000_2400",
        "WORK_WEEK": "501",
        "ASG_ID": "1111017400_06",
        "ASG_NM": "혜화안심06",
        "REMARK": "CU종로공원점",
        "REF_DATE": "20221118",
        "IMAGE": "1111017400_06_S01_402.jpeg"
      }
    ]
  }
}
```

## **서울시 안심귀갓길 안전시설물**

[https://data.seoul.go.kr/dataList/OA-21696/S/1/datasetView.do](https://data.seoul.go.kr/dataList/OA-21696/S/1/datasetView.do)

서울특별시에 위치한 362개의 안심귀갓길에 위치한 안전시설물 데이터입니다.

안심벨, 안내표지판, CCTV 등 안심귀갓길에 위치한 안전시설물을 안심귀갓길 링크아이디와 연계할 수 있도록 데이터를 구축하였습니다.

```json
- Data: JSON/XML
- SHP (geo data)

http://openapi.seoul.go.kr:8088/6e616f6e6a67756c31303478774e6e6f/json/tbSafeReturnItem/1/1

{
  "tbSafeReturnItem": {
    "list_total_count": 11883,
    "RESULT": {
      "CODE": "INFO-000",
      "MESSAGE": "정상 처리되었습니다"
    },
    "row": [
      {
        "POINT_WKT": "POINT (126.968590563668 37.5793826677127)",
        "FACI_ID": "1111011000_04_P01",
        "SGG_CODE": "1111000000",
        "SGG_NAME": "서울특별시 종로구",
        "EMD_CODE": "1111011000",
        "EMD_NM": "누하동",
        "FACI_CODE": "301",
        "ASG_ID": "1111011000_04",
        "ASG_NM": "종로안심04",
        "INSTL_CNT": "1",
        "REMARK": "",
        "INST_NM": "종로CCTV통합안전센터",
        "INST_TELNO": "02-2148-4301",
        "ASG_DATE": "2015",
        "CHCK_DATE": "",
        "DELOC": "",
        "REFDATE": "20221109",
        "IMAGE": "1111011000_04_P01_301.jpeg"
      }
    ]
  }
}
```

**좌표 결합(Join) 방식:** 지금 가지고 계신 JSON 데이터(행정동 정보 포함)와, 별도로 구한 '행정구역 경계 데이터(SHP)'를 행정동 코드(EMD_CODE)를 기준으로 결합(Join)하면 지도상에서 영역별 시각화가 가능합니다.
