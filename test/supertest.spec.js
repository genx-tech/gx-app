const testSuite = require('@genx/test');

testSuite(
    function (suite) {
        suite.testCase('smoke test', async function () {
            await suite.startRestClient_(
                'default',
                async (app, client) => {
                    await suite.testStep_('get products', async () => {
                        const result = await client.get('products');
                        should.exist(result.products);
                    });
                }
            );
        });
    }
);
