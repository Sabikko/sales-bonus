/**
 * Функция для расчета выручки
 * @param purchase запись о покупке
 * @param _product карточка товара
 * @returns {number}
 */
function calculateSimpleRevenue(purchase, _product) {

   // @TODO: Расчет выручки от операции

   const discount =  1 - (purchase.discount / 100);
   return purchase.sale_price * purchase.quantity * discount;
    
}

/**
 * Функция для расчета бонусов
 * @param index порядковый номер в отсортированном массиве
 * @param total общее число продавцов
 * @param seller карточка продавца
 * @returns {number}
 */
function calculateBonusByProfit(index, total, seller) {

    // @TODO: Расчет бонуса от позиции в рейтинге

    if (index === 0) {
        return seller.profit * 0.15;
    } else if (index === 1 || index === 2) {
        return seller.profit * 0.1;
    } else if (index === total - 1) {
        return 0;
    } else {
        return seller.profit * 0.05;
    }
}

/**
 * Функция для анализа данных продаж
 * @param data
 * @param options
 * @returns {{revenue, top_products, bonus, name, sales_count, profit, seller_id}[]}
 */
function analyzeSalesData(data, options) {

    // @TODO: Проверка входных данных

    if (!data
    || !Array.isArray(data.sellers)
    || !Array.isArray(data.product)
    || !Array.isArray(data.purchase_records)
    || !(typeof options === "object")
    || data.sellers.length === 0 
    || data.products.length === 0
    || data.purchase_records.length === 0
    ) {
        throw new Error('Некорректные входные данные');
    }    

    // @TODO: Проверка наличия опций

    const { calculateRevenue, calculateBonus } = options;

    // @TODO: Подготовка промежуточных данных для сбора статистики

    const sellerStats = data.sellers.map(seller => ({
        id: seller.id,
        name: `${seller.first_name} ${seller.last_name}`,
        revenue: 0, // Общая выручка с учётом скидок
        profit: 0, // Прибыль от продаж продавца
        sales_count: 0, // Количество продаж
        products_sold: {}
    }));

    // @TODO: Индексация продавцов и товаров для быстрого доступа

    const sellerIndex = sellerStats.reduce((result, item) => {
        result[item.id] = item; // Ключом будет id, значением — запись из sellerStats
        return result;
    }, {});
    
    const productIndex = data.products.reduce((result, item) => {
        result[item.sku] = item; // Ключом будет sku, значением — запись из data.products
        return result; 
    }, {});

    // @TODO: Расчет выручки и прибыли для каждого продавца

    data.purchase_records.forEach(record => {
        const seller = sellerIndex[record.seller_id];
        if (!seller) return;
        seller.sales_count++;

        record.items.forEach(item => {
            const product = productIndex[item.sku];
            if (!product) return;
            const cost = product.purchase_price * item.quantity;

            const revenue = calculateRevenue(item, product);

            seller.revenue += revenue;
            seller.profit += revenue - cost; 

            if (!seller.products_sold[item.sku]) {
                seller.products_sold[item.sku] = 0;
            }
            seller.products_sold[item.sku] += item.quantity;
        });
    });

    // @TODO: Сортировка продавцов по прибыли

    sellerStats.sort((seller1, seller2) => seller2.profit - seller1.profit);

    // @TODO: Назначение премий на основе ранжирования

    sellerStats.forEach((seller, index) => {
        seller.bonus = calculateBonus(index, sellerStats.length, seller); // Считаем бонус
        seller.top_products = Object.entries(seller.products_sold)
            .sort((sku1, sku2) => sku2[1] - sku1[1])
            .slice(0, 10)
            .map(([sku, quantity]) => ({sku, quantity}));
    });

    // @TODO: Подготовка итоговой коллекции с нужными полями

    return sellerStats.map(seller => ({
        seller_id: seller.id, // Строка, идентификатор продавца
        name: seller.name, // Строка, имя продавца
        revenue: +seller.revenue.toFixed(2), // Число с двумя знаками после точки, выручка продавца
        profit: +seller.profit.toFixed(2), // Число с двумя знаками после точки, прибыль продавца
        sales_count: seller.sales_count, // Целое число, количество продаж продавца
        top_products: seller.top_products, // Массив объектов вида: { "sku": "SKU_008","quantity": 10}, топ-10 товаров продавца
        bonus: +seller.bonus.toFixed(2) // Число с двумя знаками после точки, бонус продавца
    })); 
}
