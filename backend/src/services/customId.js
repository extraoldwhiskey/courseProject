const { v4: uuidv4 } = require('uuid');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

const generators = {
  fixed: (el) => el.value || '',
  random20: () => Math.floor(Math.random() * (1 << 20)).toString(),
  random32: () => Math.floor(Math.random() * 2 ** 32).toString(),
  random6: (el) => pad(Math.floor(Math.random() * 1000000), el.leadingZeros ? 6 : 0),
  random9: (el) => pad(Math.floor(Math.random() * 1000000000), el.leadingZeros ? 9 : 0),
  guid: () => uuidv4(),
  datetime: () => new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19),
  sequence: async (el, inventoryId) => {
    const last = await prisma.item.aggregate({
      where: { inventoryId },
      _max: { customId: true },
    });
    const nums = (last._max.customId || '').match(/\d+/g);
    const next = nums ? parseInt(nums[nums.length - 1]) + 1 : 1;
    return pad(next, el.leadingZeros ? el.width || 4 : 0);
  },
};

const pad = (n, width) => String(n).padStart(width, '0');

const generate = async (elements, inventoryId) => {
  const parts = await Promise.all(
    elements.map((el) => {
      const fn = generators[el.type];
      return fn ? fn(el, inventoryId) : '';
    })
  );
  return parts.join('');
};

const validate = (value, elements) => {
  const pattern = elements.map((el) => {
    if (el.type === 'fixed') return el.value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    return '.+';
  }).join('');
  return new RegExp(`^${pattern}$`).test(value);
};

module.exports = { generate, validate };
