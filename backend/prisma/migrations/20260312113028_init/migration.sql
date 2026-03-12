-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "avatar" TEXT,
    "provider" TEXT NOT NULL,
    "providerId" TEXT NOT NULL,
    "isAdmin" BOOLEAN NOT NULL DEFAULT false,
    "isBlocked" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Category" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,

    CONSTRAINT "Category_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Tag" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,

    CONSTRAINT "Tag_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "InventoryTag" (
    "inventoryId" TEXT NOT NULL,
    "tagId" INTEGER NOT NULL,

    CONSTRAINT "InventoryTag_pkey" PRIMARY KEY ("inventoryId","tagId")
);

-- CreateTable
CREATE TABLE "Inventory" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "imageUrl" TEXT,
    "isPublic" BOOLEAN NOT NULL DEFAULT false,
    "categoryId" INTEGER,
    "version" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "creatorId" TEXT NOT NULL,

    CONSTRAINT "Inventory_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "InventoryAccess" (
    "inventoryId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,

    CONSTRAINT "InventoryAccess_pkey" PRIMARY KEY ("inventoryId","userId")
);

-- CreateTable
CREATE TABLE "InventoryField" (
    "id" TEXT NOT NULL,
    "inventoryId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "fieldType" TEXT NOT NULL,
    "fieldIndex" INTEGER NOT NULL,
    "showInTable" BOOLEAN NOT NULL DEFAULT true,
    "order" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "InventoryField_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CustomIdConfig" (
    "id" TEXT NOT NULL,
    "inventoryId" TEXT NOT NULL,
    "elements" JSONB NOT NULL DEFAULT '[]',

    CONSTRAINT "CustomIdConfig_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Item" (
    "id" TEXT NOT NULL,
    "inventoryId" TEXT NOT NULL,
    "customId" TEXT NOT NULL,
    "createdById" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "version" INTEGER NOT NULL DEFAULT 0,
    "string1" TEXT,
    "string2" TEXT,
    "string3" TEXT,
    "text1" TEXT,
    "text2" TEXT,
    "text3" TEXT,
    "number1" DOUBLE PRECISION,
    "number2" DOUBLE PRECISION,
    "number3" DOUBLE PRECISION,
    "link1" TEXT,
    "link2" TEXT,
    "link3" TEXT,
    "bool1" BOOLEAN,
    "bool2" BOOLEAN,
    "bool3" BOOLEAN,

    CONSTRAINT "Item_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Like" (
    "userId" TEXT NOT NULL,
    "itemId" TEXT NOT NULL,

    CONSTRAINT "Like_pkey" PRIMARY KEY ("userId","itemId")
);

-- CreateTable
CREATE TABLE "Comment" (
    "id" TEXT NOT NULL,
    "inventoryId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Comment_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE INDEX "User_name_idx" ON "User"("name");

-- CreateIndex
CREATE INDEX "User_email_idx" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "User_provider_providerId_key" ON "User"("provider", "providerId");

-- CreateIndex
CREATE UNIQUE INDEX "Category_name_key" ON "Category"("name");

-- CreateIndex
CREATE UNIQUE INDEX "Tag_name_key" ON "Tag"("name");

-- CreateIndex
CREATE INDEX "Inventory_creatorId_idx" ON "Inventory"("creatorId");

-- CreateIndex
CREATE INDEX "Inventory_categoryId_idx" ON "Inventory"("categoryId");

-- CreateIndex
CREATE INDEX "Inventory_createdAt_idx" ON "Inventory"("createdAt" DESC);

-- CreateIndex
CREATE INDEX "InventoryAccess_userId_idx" ON "InventoryAccess"("userId");

-- CreateIndex
CREATE INDEX "InventoryField_inventoryId_order_idx" ON "InventoryField"("inventoryId", "order");

-- CreateIndex
CREATE UNIQUE INDEX "InventoryField_inventoryId_fieldType_fieldIndex_key" ON "InventoryField"("inventoryId", "fieldType", "fieldIndex");

-- CreateIndex
CREATE UNIQUE INDEX "CustomIdConfig_inventoryId_key" ON "CustomIdConfig"("inventoryId");

-- CreateIndex
CREATE INDEX "Item_inventoryId_idx" ON "Item"("inventoryId");

-- CreateIndex
CREATE INDEX "Item_createdById_idx" ON "Item"("createdById");

-- CreateIndex
CREATE UNIQUE INDEX "Item_inventoryId_customId_key" ON "Item"("inventoryId", "customId");

-- CreateIndex
CREATE INDEX "Like_itemId_idx" ON "Like"("itemId");

-- CreateIndex
CREATE INDEX "Comment_inventoryId_createdAt_idx" ON "Comment"("inventoryId", "createdAt");

-- AddForeignKey
ALTER TABLE "InventoryTag" ADD CONSTRAINT "InventoryTag_inventoryId_fkey" FOREIGN KEY ("inventoryId") REFERENCES "Inventory"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InventoryTag" ADD CONSTRAINT "InventoryTag_tagId_fkey" FOREIGN KEY ("tagId") REFERENCES "Tag"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Inventory" ADD CONSTRAINT "Inventory_creatorId_fkey" FOREIGN KEY ("creatorId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Inventory" ADD CONSTRAINT "Inventory_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "Category"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InventoryAccess" ADD CONSTRAINT "InventoryAccess_inventoryId_fkey" FOREIGN KEY ("inventoryId") REFERENCES "Inventory"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InventoryAccess" ADD CONSTRAINT "InventoryAccess_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InventoryField" ADD CONSTRAINT "InventoryField_inventoryId_fkey" FOREIGN KEY ("inventoryId") REFERENCES "Inventory"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CustomIdConfig" ADD CONSTRAINT "CustomIdConfig_inventoryId_fkey" FOREIGN KEY ("inventoryId") REFERENCES "Inventory"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Item" ADD CONSTRAINT "Item_inventoryId_fkey" FOREIGN KEY ("inventoryId") REFERENCES "Inventory"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Item" ADD CONSTRAINT "Item_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Like" ADD CONSTRAINT "Like_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Like" ADD CONSTRAINT "Like_itemId_fkey" FOREIGN KEY ("itemId") REFERENCES "Item"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Comment" ADD CONSTRAINT "Comment_inventoryId_fkey" FOREIGN KEY ("inventoryId") REFERENCES "Inventory"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Comment" ADD CONSTRAINT "Comment_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
