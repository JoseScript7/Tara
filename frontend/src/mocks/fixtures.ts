export const TRANSACTIONS_FIXTURE = [
  {
    "id": "TXN-9934",
    "customer": "Rahul Sharma",
    "amount": 9357,
    "mode": "Credit Card",
    "status": "SUCCESS",
    "settlementStatus": "SETTLED",
    "timestamp": "2026-09-17T10:56:27.631Z",
    "maskedAccount": "**** 6289",
    "timeline": [
      {
        "status": "Initiated",
        "time": "2026-09-17T10:56:27.631Z",
        "completed": true
      },
      {
        "status": "Processed",
        "time": "2026-09-17T10:56:30.631Z",
        "completed": true
      },
      {
        "status": "Settled",
        "time": "2026-09-17T22:56:27.631Z",
        "completed": true
      }
    ],
    "hasDispute": true,
    "disputeId": "DSP-8910"
  },
  {
    "id": "TXN-9916",
    "customer": "Rahul Sharma",
    "amount": 10051,
    "mode": "Wallet",
    "status": "SUCCESS",
    "settlementStatus": "PENDING",
    "timestamp": "2026-09-17T08:19:27.631Z",
    "maskedAccount": "Wallet Balance",
    "timeline": [
      {
        "status": "Initiated",
        "time": "2026-09-17T08:19:27.631Z",
        "completed": true
      },
      {
        "status": "Processed",
        "time": "2026-09-17T08:19:30.631Z",
        "completed": true
      },
      {
        "status": "Settlement Pending",
        "completed": false
      }
    ],
    "hasDispute": false
  },
  {
    "id": "TXN-9941",
    "customer": "Karan Mehta",
    "amount": 1925,
    "mode": "Wallet",
    "status": "FAILED",
    "settlementStatus": "UNSETTLED",
    "timestamp": "2026-09-17T03:27:27.631Z",
    "maskedAccount": "Wallet Balance",
    "timeline": [
      {
        "status": "Initiated",
        "time": "2026-09-17T03:27:27.631Z",
        "completed": true
      },
      {
        "status": "Failed",
        "time": "2026-09-17T03:27:30.631Z",
        "completed": true,
        "error": "Bank declined transaction"
      }
    ],
    "hasDispute": false
  },
  {
    "id": "TXN-9930",
    "customer": "Divya Kumar",
    "amount": 4625,
    "mode": "Credit Card",
    "status": "SUCCESS",
    "settlementStatus": "SETTLED",
    "timestamp": "2026-09-16T14:19:27.631Z",
    "maskedAccount": "**** 2524",
    "timeline": [
      {
        "status": "Initiated",
        "time": "2026-09-16T14:19:27.631Z",
        "completed": true
      },
      {
        "status": "Processed",
        "time": "2026-09-16T14:19:30.631Z",
        "completed": true
      },
      {
        "status": "Settled",
        "time": "2026-09-17T02:19:27.631Z",
        "completed": true
      }
    ],
    "hasDispute": false
  },
  {
    "id": "TXN-9911",
    "customer": "Karan Mehta",
    "amount": 907,
    "mode": "Credit Card",
    "status": "SUCCESS",
    "settlementStatus": "SETTLED",
    "timestamp": "2026-09-16T08:34:27.631Z",
    "maskedAccount": "**** 8131",
    "timeline": [
      {
        "status": "Initiated",
        "time": "2026-09-16T08:34:27.631Z",
        "completed": true
      },
      {
        "status": "Processed",
        "time": "2026-09-16T08:34:30.631Z",
        "completed": true
      },
      {
        "status": "Settled",
        "time": "2026-09-16T20:34:27.631Z",
        "completed": true
      }
    ],
    "hasDispute": false
  },
  {
    "id": "TXN-9907",
    "customer": "Divya Kumar",
    "amount": 9771,
    "mode": "Credit Card",
    "status": "FAILED",
    "settlementStatus": "UNSETTLED",
    "timestamp": "2026-09-16T06:15:27.631Z",
    "maskedAccount": "**** 6915",
    "timeline": [
      {
        "status": "Initiated",
        "time": "2026-09-16T06:15:27.631Z",
        "completed": true
      },
      {
        "status": "Failed",
        "time": "2026-09-16T06:15:30.631Z",
        "completed": true,
        "error": "Bank declined transaction"
      }
    ],
    "hasDispute": false
  },
  {
    "id": "TXN-9909",
    "customer": "Ankit Verma",
    "amount": 12428,
    "mode": "Wallet",
    "status": "SUCCESS",
    "settlementStatus": "SETTLED",
    "timestamp": "2026-09-15T09:14:27.631Z",
    "maskedAccount": "Wallet Balance",
    "timeline": [
      {
        "status": "Initiated",
        "time": "2026-09-15T09:14:27.631Z",
        "completed": true
      },
      {
        "status": "Processed",
        "time": "2026-09-15T09:14:30.631Z",
        "completed": true
      },
      {
        "status": "Settled",
        "time": "2026-09-15T21:14:27.631Z",
        "completed": true
      }
    ],
    "hasDispute": false
  },
  {
    "id": "TXN-9938",
    "customer": "Sneha Gupta",
    "amount": 11881,
    "mode": "Credit Card",
    "status": "PENDING",
    "settlementStatus": "UNSETTLED",
    "timestamp": "2026-09-15T08:48:27.631Z",
    "maskedAccount": "**** 7555",
    "timeline": [
      {
        "status": "Initiated",
        "time": "2026-09-15T08:48:27.631Z",
        "completed": true
      },
      {
        "status": "Processing...",
        "completed": false
      }
    ],
    "hasDispute": false
  },
  {
    "id": "TXN-9905",
    "customer": "Rahul Sharma",
    "amount": 7564,
    "mode": "UPI",
    "status": "SUCCESS",
    "settlementStatus": "SETTLED",
    "timestamp": "2026-09-15T07:54:27.631Z",
    "maskedAccount": "ru***@icici",
    "timeline": [
      {
        "status": "Initiated",
        "time": "2026-09-15T07:54:27.631Z",
        "completed": true
      },
      {
        "status": "Processed",
        "time": "2026-09-15T07:54:30.631Z",
        "completed": true
      },
      {
        "status": "Settled",
        "time": "2026-09-15T19:54:27.631Z",
        "completed": true
      }
    ],
    "hasDispute": false
  },
  {
    "id": "TXN-9936",
    "customer": "Vikram Singh",
    "amount": 6183,
    "mode": "UPI",
    "status": "SUCCESS",
    "settlementStatus": "SETTLED",
    "timestamp": "2026-09-14T04:47:27.631Z",
    "maskedAccount": "vu***@ybl",
    "timeline": [
      {
        "status": "Initiated",
        "time": "2026-09-14T04:47:27.631Z",
        "completed": true
      },
      {
        "status": "Processed",
        "time": "2026-09-14T04:47:30.631Z",
        "completed": true
      },
      {
        "status": "Settled",
        "time": "2026-09-14T16:47:27.631Z",
        "completed": true
      }
    ],
    "hasDispute": false
  },
  {
    "id": "TXN-9935",
    "customer": "Neha Patil",
    "amount": 9400,
    "mode": "UPI",
    "status": "SUCCESS",
    "settlementStatus": "SETTLED",
    "timestamp": "2026-09-14T02:57:27.631Z",
    "maskedAccount": "nu***@icici",
    "timeline": [
      {
        "status": "Initiated",
        "time": "2026-09-14T02:57:27.631Z",
        "completed": true
      },
      {
        "status": "Processed",
        "time": "2026-09-14T02:57:30.631Z",
        "completed": true
      },
      {
        "status": "Settled",
        "time": "2026-09-14T14:57:27.631Z",
        "completed": true
      }
    ],
    "hasDispute": false
  },
  {
    "id": "TXN-9929",
    "customer": "Priya Desai",
    "amount": 3994,
    "mode": "Wallet",
    "status": "SUCCESS",
    "settlementStatus": "SETTLED",
    "timestamp": "2026-09-13T13:40:27.631Z",
    "maskedAccount": "Wallet Balance",
    "timeline": [
      {
        "status": "Initiated",
        "time": "2026-09-13T13:40:27.631Z",
        "completed": true
      },
      {
        "status": "Processed",
        "time": "2026-09-13T13:40:30.631Z",
        "completed": true
      },
      {
        "status": "Settled",
        "time": "2026-09-14T01:40:27.631Z",
        "completed": true
      }
    ],
    "hasDispute": false
  },
  {
    "id": "TXN-9923",
    "customer": "Divya Kumar",
    "amount": 2848,
    "mode": "Credit Card",
    "status": "PENDING",
    "settlementStatus": "UNSETTLED",
    "timestamp": "2026-09-13T08:41:27.631Z",
    "maskedAccount": "**** 4946",
    "timeline": [
      {
        "status": "Initiated",
        "time": "2026-09-13T08:41:27.631Z",
        "completed": true
      },
      {
        "status": "Processing...",
        "completed": false
      }
    ],
    "hasDispute": false
  },
  {
    "id": "TXN-9940",
    "customer": "Neha Patil",
    "amount": 12334,
    "mode": "Wallet",
    "status": "SUCCESS",
    "settlementStatus": "SETTLED",
    "timestamp": "2026-09-13T07:55:27.631Z",
    "maskedAccount": "Wallet Balance",
    "timeline": [
      {
        "status": "Initiated",
        "time": "2026-09-13T07:55:27.631Z",
        "completed": true
      },
      {
        "status": "Processed",
        "time": "2026-09-13T07:55:30.631Z",
        "completed": true
      },
      {
        "status": "Settled",
        "time": "2026-09-13T19:55:27.631Z",
        "completed": true
      }
    ],
    "hasDispute": false
  },
  {
    "id": "TXN-9939",
    "customer": "Neha Patil",
    "amount": 8550,
    "mode": "UPI",
    "status": "PENDING",
    "settlementStatus": "UNSETTLED",
    "timestamp": "2026-09-13T04:25:27.631Z",
    "maskedAccount": "nu***@okaxis",
    "timeline": [
      {
        "status": "Initiated",
        "time": "2026-09-13T04:25:27.631Z",
        "completed": true
      },
      {
        "status": "Processing...",
        "completed": false
      }
    ],
    "hasDispute": false
  },
  {
    "id": "TXN-9917",
    "customer": "Divya Kumar",
    "amount": 8768,
    "mode": "UPI",
    "status": "SUCCESS",
    "settlementStatus": "SETTLED",
    "timestamp": "2026-09-12T14:17:27.631Z",
    "maskedAccount": "du***@paytm",
    "timeline": [
      {
        "status": "Initiated",
        "time": "2026-09-12T14:17:27.631Z",
        "completed": true
      },
      {
        "status": "Processed",
        "time": "2026-09-12T14:17:30.631Z",
        "completed": true
      },
      {
        "status": "Settled",
        "time": "2026-09-13T02:17:27.631Z",
        "completed": true
      }
    ],
    "hasDispute": false
  },
  {
    "id": "TXN-9933",
    "customer": "Rahul Sharma",
    "amount": 10988,
    "mode": "Credit Card",
    "status": "SUCCESS",
    "settlementStatus": "SETTLED",
    "timestamp": "2026-09-12T13:07:27.631Z",
    "maskedAccount": "**** 7814",
    "timeline": [
      {
        "status": "Initiated",
        "time": "2026-09-12T13:07:27.631Z",
        "completed": true
      },
      {
        "status": "Processed",
        "time": "2026-09-12T13:07:30.631Z",
        "completed": true
      },
      {
        "status": "Settled",
        "time": "2026-09-13T01:07:27.631Z",
        "completed": true
      }
    ],
    "hasDispute": false
  },
  {
    "id": "TXN-9944",
    "customer": "Amit Patel",
    "amount": 13603,
    "mode": "Credit Card",
    "status": "SUCCESS",
    "settlementStatus": "SETTLED",
    "timestamp": "2026-09-12T11:04:27.631Z",
    "maskedAccount": "**** 3823",
    "timeline": [
      {
        "status": "Initiated",
        "time": "2026-09-12T11:04:27.631Z",
        "completed": true
      },
      {
        "status": "Processed",
        "time": "2026-09-12T11:04:30.631Z",
        "completed": true
      },
      {
        "status": "Settled",
        "time": "2026-09-12T23:04:27.631Z",
        "completed": true
      }
    ],
    "hasDispute": false
  },
  {
    "id": "TXN-9900",
    "customer": "Rahul Sharma",
    "amount": 6912,
    "mode": "UPI",
    "status": "SUCCESS",
    "settlementStatus": "SETTLED",
    "timestamp": "2026-09-12T08:30:27.631Z",
    "maskedAccount": "ru***@ybl",
    "timeline": [
      {
        "status": "Initiated",
        "time": "2026-09-12T08:30:27.631Z",
        "completed": true
      },
      {
        "status": "Processed",
        "time": "2026-09-12T08:30:30.631Z",
        "completed": true
      },
      {
        "status": "Settled",
        "time": "2026-09-12T20:30:27.631Z",
        "completed": true
      }
    ],
    "hasDispute": false
  },
  {
    "id": "TXN-9924",
    "customer": "Amit Patel",
    "amount": 3481,
    "mode": "UPI",
    "status": "SUCCESS",
    "settlementStatus": "SETTLED",
    "timestamp": "2026-09-12T06:35:27.631Z",
    "maskedAccount": "au***@icici",
    "timeline": [
      {
        "status": "Initiated",
        "time": "2026-09-12T06:35:27.631Z",
        "completed": true
      },
      {
        "status": "Processed",
        "time": "2026-09-12T06:35:30.631Z",
        "completed": true
      },
      {
        "status": "Settled",
        "time": "2026-09-12T18:35:27.631Z",
        "completed": true
      }
    ],
    "hasDispute": false
  },
  {
    "id": "TXN-9903",
    "customer": "Neha Patil",
    "amount": 13037,
    "mode": "Wallet",
    "status": "SUCCESS",
    "settlementStatus": "SETTLED",
    "timestamp": "2026-09-12T04:43:27.631Z",
    "maskedAccount": "Wallet Balance",
    "timeline": [
      {
        "status": "Initiated",
        "time": "2026-09-12T04:43:27.631Z",
        "completed": true
      },
      {
        "status": "Processed",
        "time": "2026-09-12T04:43:30.631Z",
        "completed": true
      },
      {
        "status": "Settled",
        "time": "2026-09-12T16:43:27.631Z",
        "completed": true
      }
    ],
    "hasDispute": false
  },
  {
    "id": "TXN-9913",
    "customer": "Pooja Reddy",
    "amount": 6985,
    "mode": "UPI",
    "status": "SUCCESS",
    "settlementStatus": "SETTLED",
    "timestamp": "2026-09-12T04:14:27.631Z",
    "maskedAccount": "pu***@paytm",
    "timeline": [
      {
        "status": "Initiated",
        "time": "2026-09-12T04:14:27.631Z",
        "completed": true
      },
      {
        "status": "Processed",
        "time": "2026-09-12T04:14:30.631Z",
        "completed": true
      },
      {
        "status": "Settled",
        "time": "2026-09-12T16:14:27.631Z",
        "completed": true
      }
    ],
    "hasDispute": false
  },
  {
    "id": "TXN-9910",
    "customer": "Amit Patel",
    "amount": 1806,
    "mode": "Credit Card",
    "status": "SUCCESS",
    "settlementStatus": "SETTLED",
    "timestamp": "2026-09-12T03:30:27.631Z",
    "maskedAccount": "**** 4344",
    "timeline": [
      {
        "status": "Initiated",
        "time": "2026-09-12T03:30:27.631Z",
        "completed": true
      },
      {
        "status": "Processed",
        "time": "2026-09-12T03:30:30.631Z",
        "completed": true
      },
      {
        "status": "Settled",
        "time": "2026-09-12T15:30:27.631Z",
        "completed": true
      }
    ],
    "hasDispute": false
  },
  {
    "id": "TXN-9915",
    "customer": "Ankit Verma",
    "amount": 3351,
    "mode": "UPI",
    "status": "SUCCESS",
    "settlementStatus": "SETTLED",
    "timestamp": "2026-09-11T12:09:27.631Z",
    "maskedAccount": "au***@paytm",
    "timeline": [
      {
        "status": "Initiated",
        "time": "2026-09-11T12:09:27.631Z",
        "completed": true
      },
      {
        "status": "Processed",
        "time": "2026-09-11T12:09:30.631Z",
        "completed": true
      },
      {
        "status": "Settled",
        "time": "2026-09-12T00:09:27.631Z",
        "completed": true
      }
    ],
    "hasDispute": false
  },
  {
    "id": "TXN-9931",
    "customer": "Divya Kumar",
    "amount": 1492,
    "mode": "Credit Card",
    "status": "SUCCESS",
    "settlementStatus": "SETTLED",
    "timestamp": "2026-09-11T08:23:27.631Z",
    "maskedAccount": "**** 4757",
    "timeline": [
      {
        "status": "Initiated",
        "time": "2026-09-11T08:23:27.631Z",
        "completed": true
      },
      {
        "status": "Processed",
        "time": "2026-09-11T08:23:30.631Z",
        "completed": true
      },
      {
        "status": "Settled",
        "time": "2026-09-11T20:23:27.631Z",
        "completed": true
      }
    ],
    "hasDispute": false
  },
  {
    "id": "TXN-9918",
    "customer": "Rahul Sharma",
    "amount": 764,
    "mode": "Wallet",
    "status": "SUCCESS",
    "settlementStatus": "SETTLED",
    "timestamp": "2026-09-10T11:45:27.631Z",
    "maskedAccount": "Wallet Balance",
    "timeline": [
      {
        "status": "Initiated",
        "time": "2026-09-10T11:45:27.631Z",
        "completed": true
      },
      {
        "status": "Processed",
        "time": "2026-09-10T11:45:30.631Z",
        "completed": true
      },
      {
        "status": "Settled",
        "time": "2026-09-10T23:45:27.631Z",
        "completed": true
      }
    ],
    "hasDispute": false
  },
  {
    "id": "TXN-9927",
    "customer": "Ankit Verma",
    "amount": 2082,
    "mode": "UPI",
    "status": "SUCCESS",
    "settlementStatus": "SETTLED",
    "timestamp": "2026-09-10T08:50:27.631Z",
    "maskedAccount": "au***@okaxis",
    "timeline": [
      {
        "status": "Initiated",
        "time": "2026-09-10T08:50:27.631Z",
        "completed": true
      },
      {
        "status": "Processed",
        "time": "2026-09-10T08:50:30.631Z",
        "completed": true
      },
      {
        "status": "Settled",
        "time": "2026-09-10T20:50:27.631Z",
        "completed": true
      }
    ],
    "hasDispute": false
  },
  {
    "id": "TXN-9942",
    "customer": "Rahul Sharma",
    "amount": 3835,
    "mode": "UPI",
    "status": "FAILED",
    "settlementStatus": "UNSETTLED",
    "timestamp": "2026-09-10T08:45:27.631Z",
    "maskedAccount": "ru***@ybl",
    "timeline": [
      {
        "status": "Initiated",
        "time": "2026-09-10T08:45:27.631Z",
        "completed": true
      },
      {
        "status": "Failed",
        "time": "2026-09-10T08:45:30.631Z",
        "completed": true,
        "error": "Bank declined transaction"
      }
    ],
    "hasDispute": false
  },
  {
    "id": "TXN-9922",
    "customer": "Karan Mehta",
    "amount": 297,
    "mode": "Wallet",
    "status": "FAILED",
    "settlementStatus": "UNSETTLED",
    "timestamp": "2026-09-10T04:10:27.631Z",
    "maskedAccount": "Wallet Balance",
    "timeline": [
      {
        "status": "Initiated",
        "time": "2026-09-10T04:10:27.631Z",
        "completed": true
      },
      {
        "status": "Failed",
        "time": "2026-09-10T04:10:30.631Z",
        "completed": true,
        "error": "Bank declined transaction"
      }
    ],
    "hasDispute": false
  },
  {
    "id": "TXN-9928",
    "customer": "Sneha Gupta",
    "amount": 3945,
    "mode": "UPI",
    "status": "SUCCESS",
    "settlementStatus": "SETTLED",
    "timestamp": "2026-09-09T08:44:27.631Z",
    "maskedAccount": "su***@okaxis",
    "timeline": [
      {
        "status": "Initiated",
        "time": "2026-09-09T08:44:27.631Z",
        "completed": true
      },
      {
        "status": "Processed",
        "time": "2026-09-09T08:44:30.631Z",
        "completed": true
      },
      {
        "status": "Settled",
        "time": "2026-09-09T20:44:27.631Z",
        "completed": true
      }
    ],
    "hasDispute": false
  },
  {
    "id": "TXN-9919",
    "customer": "Neha Patil",
    "amount": 4655,
    "mode": "UPI",
    "status": "PENDING",
    "settlementStatus": "UNSETTLED",
    "timestamp": "2026-09-09T05:37:27.631Z",
    "maskedAccount": "nu***@okhdfcbank",
    "timeline": [
      {
        "status": "Initiated",
        "time": "2026-09-09T05:37:27.631Z",
        "completed": true
      },
      {
        "status": "Processing...",
        "completed": false
      }
    ],
    "hasDispute": false
  },
  {
    "id": "TXN-9937",
    "customer": "Priya Desai",
    "amount": 1084,
    "mode": "Credit Card",
    "status": "SUCCESS",
    "settlementStatus": "SETTLED",
    "timestamp": "2026-09-08T08:56:27.631Z",
    "maskedAccount": "**** 7053",
    "timeline": [
      {
        "status": "Initiated",
        "time": "2026-09-08T08:56:27.631Z",
        "completed": true
      },
      {
        "status": "Processed",
        "time": "2026-09-08T08:56:30.631Z",
        "completed": true
      },
      {
        "status": "Settled",
        "time": "2026-09-08T20:56:27.631Z",
        "completed": true
      }
    ],
    "hasDispute": false
  },
  {
    "id": "TXN-9925",
    "customer": "Vikram Singh",
    "amount": 14757,
    "mode": "Wallet",
    "status": "PENDING",
    "settlementStatus": "UNSETTLED",
    "timestamp": "2026-09-07T12:08:27.631Z",
    "maskedAccount": "Wallet Balance",
    "timeline": [
      {
        "status": "Initiated",
        "time": "2026-09-07T12:08:27.631Z",
        "completed": true
      },
      {
        "status": "Processing...",
        "completed": false
      }
    ],
    "hasDispute": false
  },
  {
    "id": "TXN-9912",
    "customer": "Sneha Gupta",
    "amount": 608,
    "mode": "UPI",
    "status": "SUCCESS",
    "settlementStatus": "SETTLED",
    "timestamp": "2026-09-07T11:37:27.631Z",
    "maskedAccount": "su***@okaxis",
    "timeline": [
      {
        "status": "Initiated",
        "time": "2026-09-07T11:37:27.631Z",
        "completed": true
      },
      {
        "status": "Processed",
        "time": "2026-09-07T11:37:30.631Z",
        "completed": true
      },
      {
        "status": "Settled",
        "time": "2026-09-07T23:37:27.631Z",
        "completed": true
      }
    ],
    "hasDispute": false
  },
  {
    "id": "TXN-9932",
    "customer": "Karan Mehta",
    "amount": 13030,
    "mode": "UPI",
    "status": "PENDING",
    "settlementStatus": "UNSETTLED",
    "timestamp": "2026-09-07T03:36:27.631Z",
    "maskedAccount": "ku***@paytm",
    "timeline": [
      {
        "status": "Initiated",
        "time": "2026-09-07T03:36:27.631Z",
        "completed": true
      },
      {
        "status": "Processing...",
        "completed": false
      }
    ],
    "hasDispute": false
  },
  {
    "id": "TXN-9914",
    "customer": "Rahul Sharma",
    "amount": 13937,
    "mode": "Wallet",
    "status": "SUCCESS",
    "settlementStatus": "SETTLED",
    "timestamp": "2026-09-06T02:36:27.631Z",
    "maskedAccount": "Wallet Balance",
    "timeline": [
      {
        "status": "Initiated",
        "time": "2026-09-06T02:36:27.631Z",
        "completed": true
      },
      {
        "status": "Processed",
        "time": "2026-09-06T02:36:30.631Z",
        "completed": true
      },
      {
        "status": "Settled",
        "time": "2026-09-06T14:36:27.631Z",
        "completed": true
      }
    ],
    "hasDispute": false
  },
  {
    "id": "TXN-9904",
    "customer": "Ankit Verma",
    "amount": 7634,
    "mode": "Wallet",
    "status": "SUCCESS",
    "settlementStatus": "SETTLED",
    "timestamp": "2026-09-05T11:56:27.631Z",
    "maskedAccount": "Wallet Balance",
    "timeline": [
      {
        "status": "Initiated",
        "time": "2026-09-05T11:56:27.631Z",
        "completed": true
      },
      {
        "status": "Processed",
        "time": "2026-09-05T11:56:30.631Z",
        "completed": true
      },
      {
        "status": "Settled",
        "time": "2026-09-05T23:56:27.631Z",
        "completed": true
      }
    ],
    "hasDispute": false
  },
  {
    "id": "TXN-9901",
    "customer": "Pooja Reddy",
    "amount": 5425,
    "mode": "Credit Card",
    "status": "PENDING",
    "settlementStatus": "UNSETTLED",
    "timestamp": "2026-09-05T09:48:27.631Z",
    "maskedAccount": "**** 1399",
    "timeline": [
      {
        "status": "Initiated",
        "time": "2026-09-05T09:48:27.631Z",
        "completed": true
      },
      {
        "status": "Processing...",
        "completed": false
      }
    ],
    "hasDispute": false
  },
  {
    "id": "TXN-9926",
    "customer": "Karan Mehta",
    "amount": 1374,
    "mode": "Credit Card",
    "status": "FAILED",
    "settlementStatus": "UNSETTLED",
    "timestamp": "2026-09-05T07:20:27.631Z",
    "maskedAccount": "**** 8787",
    "timeline": [
      {
        "status": "Initiated",
        "time": "2026-09-05T07:20:27.631Z",
        "completed": true
      },
      {
        "status": "Failed",
        "time": "2026-09-05T07:20:30.631Z",
        "completed": true,
        "error": "Bank declined transaction"
      }
    ],
    "hasDispute": false
  },
  {
    "id": "TXN-9906",
    "customer": "Sneha Gupta",
    "amount": 9607,
    "mode": "Credit Card",
    "status": "SUCCESS",
    "settlementStatus": "SETTLED",
    "timestamp": "2026-09-05T04:37:27.631Z",
    "maskedAccount": "**** 4400",
    "timeline": [
      {
        "status": "Initiated",
        "time": "2026-09-05T04:37:27.631Z",
        "completed": true
      },
      {
        "status": "Processed",
        "time": "2026-09-05T04:37:30.631Z",
        "completed": true
      },
      {
        "status": "Settled",
        "time": "2026-09-05T16:37:27.631Z",
        "completed": true
      }
    ],
    "hasDispute": false
  },
  {
    "id": "TXN-9921",
    "customer": "Priya Desai",
    "amount": 6944,
    "mode": "UPI",
    "status": "PENDING",
    "settlementStatus": "UNSETTLED",
    "timestamp": "2026-09-04T13:17:27.631Z",
    "maskedAccount": "pu***@paytm",
    "timeline": [
      {
        "status": "Initiated",
        "time": "2026-09-04T13:17:27.631Z",
        "completed": true
      },
      {
        "status": "Processing...",
        "completed": false
      }
    ],
    "hasDispute": false
  },
  {
    "id": "TXN-9943",
    "customer": "Divya Kumar",
    "amount": 7816,
    "mode": "Credit Card",
    "status": "SUCCESS",
    "settlementStatus": "SETTLED",
    "timestamp": "2026-09-04T12:19:27.631Z",
    "maskedAccount": "**** 2747",
    "timeline": [
      {
        "status": "Initiated",
        "time": "2026-09-04T12:19:27.631Z",
        "completed": true
      },
      {
        "status": "Processed",
        "time": "2026-09-04T12:19:30.631Z",
        "completed": true
      },
      {
        "status": "Settled",
        "time": "2026-09-05T00:19:27.631Z",
        "completed": true
      }
    ],
    "hasDispute": false
  },
  {
    "id": "TXN-9908",
    "customer": "Divya Kumar",
    "amount": 4368,
    "mode": "Credit Card",
    "status": "SUCCESS",
    "settlementStatus": "SETTLED",
    "timestamp": "2026-09-04T11:41:27.631Z",
    "maskedAccount": "**** 4905",
    "timeline": [
      {
        "status": "Initiated",
        "time": "2026-09-04T11:41:27.631Z",
        "completed": true
      },
      {
        "status": "Processed",
        "time": "2026-09-04T11:41:30.631Z",
        "completed": true
      },
      {
        "status": "Settled",
        "time": "2026-09-04T23:41:27.631Z",
        "completed": true
      }
    ],
    "hasDispute": false
  },
  {
    "id": "TXN-9920",
    "customer": "Priya Desai",
    "amount": 1585,
    "mode": "UPI",
    "status": "SUCCESS",
    "settlementStatus": "SETTLED",
    "timestamp": "2026-09-04T10:21:27.631Z",
    "maskedAccount": "pu***@okhdfcbank",
    "timeline": [
      {
        "status": "Initiated",
        "time": "2026-09-04T10:21:27.631Z",
        "completed": true
      },
      {
        "status": "Processed",
        "time": "2026-09-04T10:21:30.631Z",
        "completed": true
      },
      {
        "status": "Settled",
        "time": "2026-09-04T22:21:27.631Z",
        "completed": true
      }
    ],
    "hasDispute": false
  },
  {
    "id": "TXN-9902",
    "customer": "Priya Desai",
    "amount": 4482,
    "mode": "UPI",
    "status": "SUCCESS",
    "settlementStatus": "SETTLED",
    "timestamp": "2026-09-04T09:17:27.631Z",
    "maskedAccount": "pu***@ybl",
    "timeline": [
      {
        "status": "Initiated",
        "time": "2026-09-04T09:17:27.631Z",
        "completed": true
      },
      {
        "status": "Processed",
        "time": "2026-09-04T09:17:30.631Z",
        "completed": true
      },
      {
        "status": "Settled",
        "time": "2026-09-04T21:17:27.631Z",
        "completed": true
      }
    ],
    "hasDispute": false
  }
];

export const DISPUTES_FIXTURE = [
  { 
    id: 'DSP-8910', 
    amount: 12000, 
    reason: 'Customer claims double charge', 
    status: 'ESCALATED', 
    source: 'MERCHANT_RAISED',
    tatDeadline: new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString(), // 2 hours left (Red)
    date: new Date(Date.now() - 4.9 * 24 * 60 * 60 * 1000).toISOString(),
    reasoningTrace: {
      traceId: 'tr_1982abc',
      notes: 'RAG retrieval matched "NPCI UDIR Circular 2023 on Double Debits". Escalated to manual queue because T+5 TAT breach is imminent within 2 hours.',
      citation: 'NPCI UDIR: "For duplicate processing, acquirer must reverse within T+5 days else penalty of ₹100/day applies."'
    },
    compensationProposed: {
      amount: 12000,
      approvalId: 'app_9910',
      reason: 'Refund customer to avoid T+5 TAT breach penalty.'
    }
  },
  { 
    id: 'DSP-8911', 
    amount: 450, 
    reason: 'Item not received', 
    status: 'OPEN', 
    source: 'AGENT_DETECTED',
    tatDeadline: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(), // 24 hours left (Amber)
    date: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString(),
    reasoningTrace: {
      traceId: 'tr_8821xyz',
      notes: 'Customer raised issue via support bot. RAG matched "Standard E-commerce Non-delivery Dispute". Auto-holding funds.',
      citation: 'Merchant Agreement Section 4.2: "Hold funds for 7 days pending delivery proof."'
    },
    compensationProposed: null
  },
  { 
    id: 'DSP-8912', 
    amount: 3200, 
    reason: 'Fraudulent transaction', 
    status: 'OPEN', 
    source: 'MERCHANT_RAISED',
    tatDeadline: new Date(Date.now() + 72 * 60 * 60 * 1000).toISOString(), // 72 hours left (Green)
    date: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
    reasoningTrace: {
      traceId: 'tr_5541def',
      notes: 'Merchant flagged transaction. Velocity checks normal, but IP mismatch detected. Waiting for merchant to upload proof of delivery.',
      citation: 'RBI Master Direction on Fraud 2016: "Report suspected transactions within T+2 days."'
    },
    compensationProposed: null
  },
  { 
    id: 'DSP-8913', 
    amount: 850, 
    reason: 'Wrong amount deducted', 
    status: 'AUTO_CREDITED', 
    source: 'AGENT_DETECTED',
    tatDeadline: new Date(Date.now() - 10 * 60 * 60 * 1000).toISOString(), // Expired
    date: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000).toISOString(),
    reasoningTrace: {
      traceId: 'tr_2210lmn',
      notes: 'System detected ₹850 deduction for a ₹85 order. LATS engine auto-corrected based on menu pricing RAG context.',
      citation: 'Internal Policy: Auto-refund exact overcharge amounts under ₹1000.'
    },
    compensationProposed: null
  }
];

export const SETTLEMENTS_FIXTURE = [
  {
    "id": "PENDING_SETTLEMENT",
    "date": "2026-10-20T08:00:00.000Z",
    "grossAmount": 18973,
    "mdrDeduction": 75.89,
    "netAmount": 18897.11,
    "status": "PENDING",
    "bank": "HDFC Bank ****4021"
  },
  {
    "id": "UTR-HDFC-814909",
    "date": "2026-10-19T08:00:00.000Z",
    "grossAmount": 22529,
    "mdrDeduction": 90.12,
    "netAmount": 22438.88,
    "status": "PROCESSED",
    "bank": "HDFC Bank ****4021"
  },
  {
    "id": "UTR-HDFC-296150",
    "date": "2026-10-18T08:00:00.000Z",
    "grossAmount": 15142,
    "mdrDeduction": 60.57,
    "netAmount": 15081.43,
    "status": "PROCESSED",
    "bank": "HDFC Bank ****4021"
  },
  {
    "id": "UTR-HDFC-844466",
    "date": "2026-10-17T08:00:00.000Z",
    "grossAmount": 23022,
    "mdrDeduction": 92.09,
    "netAmount": 22929.91,
    "status": "PROCESSED",
    "bank": "HDFC Bank ****4021"
  },
  {
    "id": "UTR-HDFC-864828",
    "date": "2026-10-16T08:00:00.000Z",
    "grossAmount": 53547,
    "mdrDeduction": 214.19,
    "netAmount": 53332.81,
    "status": "PROCESSED",
    "bank": "HDFC Bank ****4021"
  },
  {
    "id": "UTR-HDFC-730110",
    "date": "2026-10-15T08:00:00.000Z",
    "grossAmount": 55953,
    "mdrDeduction": 223.81,
    "netAmount": 55729.19,
    "status": "PROCESSED",
    "bank": "HDFC Bank ****4021"
  },
  {
    "id": "UTR-HDFC-503038",
    "date": "2026-10-14T08:00:00.000Z",
    "grossAmount": 38542,
    "mdrDeduction": 0,
    "netAmount": 38542,
    "status": "PROCESSED",
    "bank": "HDFC Bank ****4021"
  },
  {
    "id": "UTR-HDFC-286467",
    "date": "2026-10-13T08:00:00.000Z",
    "grossAmount": 62932,
    "mdrDeduction": 0,
    "netAmount": 62932,
    "status": "PROCESSED",
    "bank": "HDFC Bank ****4021"
  },
  {
    "id": "UTR-HDFC-478918",
    "date": "2026-10-12T08:00:00.000Z",
    "grossAmount": 49515,
    "mdrDeduction": 0,
    "netAmount": 49515,
    "status": "PROCESSED",
    "bank": "HDFC Bank ****4021"
  },
  {
    "id": "UTR-HDFC-343638",
    "date": "2026-10-11T08:00:00.000Z",
    "grossAmount": 44136,
    "mdrDeduction": 0,
    "netAmount": 44136,
    "status": "PROCESSED",
    "bank": "HDFC Bank ****4021"
  },
  {
    "id": "UTR-HDFC-863576",
    "date": "2026-10-10T08:00:00.000Z",
    "grossAmount": 22427,
    "mdrDeduction": 0,
    "netAmount": 22427,
    "status": "PROCESSED",
    "bank": "HDFC Bank ****4021"
  },
  {
    "id": "UTR-HDFC-982847",
    "date": "2026-10-09T08:00:00.000Z",
    "grossAmount": 20054,
    "mdrDeduction": 0,
    "netAmount": 20054,
    "status": "PROCESSED",
    "bank": "HDFC Bank ****4021"
  },
  {
    "id": "UTR-HDFC-132023",
    "date": "2026-10-08T08:00:00.000Z",
    "grossAmount": 55677,
    "mdrDeduction": 0,
    "netAmount": 55677,
    "status": "PROCESSED",
    "bank": "HDFC Bank ****4021"
  },
  {
    "id": "UTR-HDFC-198170",
    "date": "2026-10-07T08:00:00.000Z",
    "grossAmount": 23837,
    "mdrDeduction": 0,
    "netAmount": 23837,
    "status": "PROCESSED",
    "bank": "HDFC Bank ****4021"
  },
  {
    "id": "UTR-HDFC-967523",
    "date": "2026-10-06T08:00:00.000Z",
    "grossAmount": 63075,
    "mdrDeduction": 0,
    "netAmount": 63075,
    "status": "PROCESSED",
    "bank": "HDFC Bank ****4021"
  },
  {
    "id": "UTR-HDFC-498165",
    "date": "2026-10-05T08:00:00.000Z",
    "grossAmount": 60379,
    "mdrDeduction": 0,
    "netAmount": 60379,
    "status": "PROCESSED",
    "bank": "HDFC Bank ****4021"
  },
  {
    "id": "UTR-HDFC-749184",
    "date": "2026-10-04T08:00:00.000Z",
    "grossAmount": 20584,
    "mdrDeduction": 0,
    "netAmount": 20584,
    "status": "PROCESSED",
    "bank": "HDFC Bank ****4021"
  },
  {
    "id": "UTR-HDFC-227779",
    "date": "2026-10-03T08:00:00.000Z",
    "grossAmount": 56689,
    "mdrDeduction": 0,
    "netAmount": 56689,
    "status": "PROCESSED",
    "bank": "HDFC Bank ****4021"
  },
  {
    "id": "UTR-HDFC-824751",
    "date": "2026-10-02T08:00:00.000Z",
    "grossAmount": 50048,
    "mdrDeduction": 0,
    "netAmount": 50048,
    "status": "PROCESSED",
    "bank": "HDFC Bank ****4021"
  },
  {
    "id": "UTR-HDFC-995686",
    "date": "2026-10-01T08:00:00.000Z",
    "grossAmount": 40111,
    "mdrDeduction": 0,
    "netAmount": 40111,
    "status": "PROCESSED",
    "bank": "HDFC Bank ****4021"
  },
  {
    "id": "UTR-HDFC-939350",
    "date": "2026-09-30T08:00:00.000Z",
    "grossAmount": 21360,
    "mdrDeduction": 0,
    "netAmount": 21360,
    "status": "PROCESSED",
    "bank": "HDFC Bank ****4021"
  },
  {
    "id": "UTR-HDFC-185369",
    "date": "2026-09-29T08:00:00.000Z",
    "grossAmount": 27808,
    "mdrDeduction": 0,
    "netAmount": 27808,
    "status": "PROCESSED",
    "bank": "HDFC Bank ****4021"
  },
  {
    "id": "UTR-HDFC-959618",
    "date": "2026-09-28T08:00:00.000Z",
    "grossAmount": 54625,
    "mdrDeduction": 0,
    "netAmount": 54625,
    "status": "PROCESSED",
    "bank": "HDFC Bank ****4021"
  },
  {
    "id": "UTR-HDFC-697399",
    "date": "2026-09-27T08:00:00.000Z",
    "grossAmount": 16341,
    "mdrDeduction": 0,
    "netAmount": 16341,
    "status": "PROCESSED",
    "bank": "HDFC Bank ****4021"
  },
  {
    "id": "UTR-HDFC-714528",
    "date": "2026-09-26T08:00:00.000Z",
    "grossAmount": 50616,
    "mdrDeduction": 0,
    "netAmount": 50616,
    "status": "PROCESSED",
    "bank": "HDFC Bank ****4021"
  },
  {
    "id": "UTR-HDFC-848366",
    "date": "2026-09-25T08:00:00.000Z",
    "grossAmount": 54861,
    "mdrDeduction": 0,
    "netAmount": 54861,
    "status": "PROCESSED",
    "bank": "HDFC Bank ****4021"
  },
  {
    "id": "UTR-HDFC-811152",
    "date": "2026-09-24T08:00:00.000Z",
    "grossAmount": 34354,
    "mdrDeduction": 0,
    "netAmount": 34354,
    "status": "PROCESSED",
    "bank": "HDFC Bank ****4021"
  },
  {
    "id": "UTR-HDFC-878393",
    "date": "2026-09-23T08:00:00.000Z",
    "grossAmount": 63578,
    "mdrDeduction": 0,
    "netAmount": 63578,
    "status": "PROCESSED",
    "bank": "HDFC Bank ****4021"
  },
  {
    "id": "UTR-HDFC-392616",
    "date": "2026-09-22T08:00:00.000Z",
    "grossAmount": 53147,
    "mdrDeduction": 0,
    "netAmount": 53147,
    "status": "PROCESSED",
    "bank": "HDFC Bank ****4021"
  },
  {
    "id": "UTR-HDFC-672942",
    "date": "2026-09-21T08:00:00.000Z",
    "grossAmount": 29522,
    "mdrDeduction": 0,
    "netAmount": 29522,
    "status": "PROCESSED",
    "bank": "HDFC Bank ****4021"
  },
  {
    "id": "UTR-HDFC-502036",
    "date": "2026-09-20T08:00:00.000Z",
    "grossAmount": 18350,
    "mdrDeduction": 0,
    "netAmount": 18350,
    "status": "PROCESSED",
    "bank": "HDFC Bank ****4021"
  },
  {
    "id": "UTR-HDFC-817458",
    "date": "2026-09-19T08:00:00.000Z",
    "grossAmount": 57482,
    "mdrDeduction": 0,
    "netAmount": 57482,
    "status": "PROCESSED",
    "bank": "HDFC Bank ****4021"
  },
  {
    "id": "UTR-HDFC-552548",
    "date": "2026-09-18T08:00:00.000Z",
    "grossAmount": 22912,
    "mdrDeduction": 0,
    "netAmount": 22912,
    "status": "PROCESSED",
    "bank": "HDFC Bank ****4021"
  },
  {
    "id": "UTR-HDFC-894676",
    "date": "2026-09-17T08:00:00.000Z",
    "grossAmount": 19420,
    "mdrDeduction": 0,
    "netAmount": 19420,
    "status": "PROCESSED",
    "bank": "HDFC Bank ****4021"
  },
  {
    "id": "UTR-HDFC-951300",
    "date": "2026-09-16T08:00:00.000Z",
    "grossAmount": 21940,
    "mdrDeduction": 0,
    "netAmount": 21940,
    "status": "PROCESSED",
    "bank": "HDFC Bank ****4021"
  },
  {
    "id": "UTR-HDFC-545279",
    "date": "2026-09-15T08:00:00.000Z",
    "grossAmount": 22369,
    "mdrDeduction": 0,
    "netAmount": 22369,
    "status": "PROCESSED",
    "bank": "HDFC Bank ****4021"
  },
  {
    "id": "UTR-HDFC-723534",
    "date": "2026-09-14T08:00:00.000Z",
    "grossAmount": 62434,
    "mdrDeduction": 0,
    "netAmount": 62434,
    "status": "PROCESSED",
    "bank": "HDFC Bank ****4021"
  },
  {
    "id": "UTR-HDFC-180328",
    "date": "2026-09-13T08:00:00.000Z",
    "grossAmount": 21542,
    "mdrDeduction": 0,
    "netAmount": 21542,
    "status": "PROCESSED",
    "bank": "HDFC Bank ****4021"
  },
  {
    "id": "UTR-HDFC-778963",
    "date": "2026-09-12T08:00:00.000Z",
    "grossAmount": 53521,
    "mdrDeduction": 0,
    "netAmount": 53521,
    "status": "PROCESSED",
    "bank": "HDFC Bank ****4021"
  },
  {
    "id": "UTR-HDFC-518264",
    "date": "2026-09-11T08:00:00.000Z",
    "grossAmount": 15929,
    "mdrDeduction": 0,
    "netAmount": 15929,
    "status": "PROCESSED",
    "bank": "HDFC Bank ****4021"
  }
];

export const DEVICES_FIXTURE = [
  { 
    id: 'SB-4421', 
    type: 'Soundbox 2.0', 
    battery: '12%', 
    network: '4G - Disconnected', 
    status: 'OFFLINE',
    lastPing: new Date(Date.now() - 6.5 * 60 * 60 * 1000).toISOString(), // 6.5 hours ago
    firmware: 'v2.4.1',
    uptimeData: Array.from({length: 24}, (_, i) => i < 17 ? 100 : 0) // Online then offline for last 7 hours
  },
  { 
    id: 'POS-9982', 
    type: 'EDC Machine', 
    battery: '85%', 
    network: 'Wi-Fi', 
    status: 'ONLINE',
    lastPing: new Date(Date.now() - 2 * 60 * 1000).toISOString(), // 2 mins ago
    firmware: 'v4.1.0',
    uptimeData: Array.from({length: 24}, () => 90 + Math.random() * 10) // Always 90-100%
  }
];

export const OFFERS_FIXTURE = [
  { 
    id: 'LN-01', 
    type: 'LOAN',
    title: 'Pre-Approved Business Loan', 
    amount: 500000, 
    rate: '1.5%', // Monthly
    status: 'AVAILABLE',
    description: 'Based on your strong GTV of ₹4.8L last month, you are eligible for an instant business loan.'
  },
  { 
    id: 'HW-01', 
    type: 'HARDWARE',
    title: 'Free Soundbox 3.0 Upgrade', 
    amount: 0, 
    rate: '-', 
    status: 'AVAILABLE',
    description: 'Trade in your old Soundbox for the latest model with 4G connectivity.'
  },
  { 
    id: 'QR-01', 
    type: 'COLLATERAL',
    title: 'QR Sticker Kit Reorder', 
    amount: 0, 
    rate: '-', 
    status: 'AVAILABLE',
    description: 'Get 5 new QR code stickers for your store counters.'
  }
];

export const SUPPORT_TICKETS_FIXTURE = [
  {
    id: 'TKT-9912',
    category: 'Payments',
    title: 'Customer claims money deducted but order failed',
    status: 'ESCALATED_TO_HUMAN',
    openedDate: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString()
  },
  {
    id: 'TKT-9910',
    category: 'Devices',
    title: 'Soundbox battery draining too fast',
    status: 'OPEN',
    openedDate: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString()
  },
  {
    id: 'TKT-8841',
    category: 'Settlements',
    title: 'Missing settlement for Oct 14th',
    status: 'RESOLVED',
    openedDate: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString()
  }
];
