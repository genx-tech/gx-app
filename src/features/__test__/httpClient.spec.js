"use strict";

const { HttpClient } = require("../httpClient");
const superagent = require("superagent");

describe("feature:httpClient", function () {
    it("get list with endpoint", async function () {
        let httpClient = new HttpClient(superagent, "https://dummyjson.com");

        should.exist(httpClient);

        const result = await httpClient.get("products");
        //console.log(result);
        should.exist(result);

        result.should.have.keys('total', 'skip', 'limit');        
        Array.isArray(result.products).should.be.ok();
    });

    it("get one with endpoint", async function () {
        let httpClient = new HttpClient(superagent, "https://dummyjson.com");

        should.exist(httpClient);

        const result = await httpClient.get("products/1");
        should.exist(result);
        should.exist(result.id);
    });

    it("post one with endpoint in options", async function () {
        let httpClient = new HttpClient(superagent);

        should.exist(httpClient);

        const result = await httpClient.post("add", {  title: 'Dummy product' }, null, {
            endpoint: "https://dummyjson.com/products",
        });
        
        should.exist(result);
        should.exist(result.id);
        result.title.should.be.exactly('Dummy product');
    });
});
