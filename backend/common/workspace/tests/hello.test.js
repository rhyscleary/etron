'use strict';

//const { helloHandler } = require('../functions/hello.js');
import { helloHandler } from '../functions/hello.js';

describe('Tests index', function () {
    it('verifies successful response', async () => {
        const event = {}
        const context = {};
        //const hello = "hi"
        

        const result = await helloHandler(event, context)

        expect(result).toBeInstanceOf(Object);
        expect(result.statusCode).toEqual(200);

        let response = JSON.parse(result.body);

        expect(response).toBeInstanceOf(Object);
        expect(response.message).toEqual("hello world");
    });
});
