# Python 3.10
import requests

while True:
    req = input("Command: ")
    arr = req.split(',')
    cmd = arr[0]
    match cmd: # Only Python 3.10 and above support this
        case 'exit':
            break
        case 'ADD':
            response = requests.post(
                'http://localhost/add_user',
                json = {"userID": arr[1], "balance": arr[2]}
            )
            print(response.json())
        case 'QUOTE':
            response = requests.get(
                f'http://localhost/quote?userID={arr[1]}&symbol={arr[2]}'
            )
            print(response.json())