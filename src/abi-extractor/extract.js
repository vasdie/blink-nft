const { ethers } = require("ethers");
const { whatsabi } = require("@shazow/whatsabi");

async function getABI() {
    console.log("🔍 Analizando minimal proxy...");
    
    const provider = new ethers.JsonRpcProvider("https://testnet-rpc.monad.xyz");
    const proxyAddress = "0x8f5D0e7BFfFF2213f4e00AFbE7D049e53Abeb2e6";
    
    try {
        const bytecode = await provider.getCode(proxyAddress);
        console.log("📊 Bytecode del proxy:", bytecode);
        
        const hex = bytecode.slice(2);
        
        if (hex.startsWith("3d3d3d3d363d3d37363d73")) {
            console.log("✅ Confirmado: Es un minimal proxy EIP-1167");
            
            const prefix = "3d3d3d3d363d3d37363d73";
            const addressHex = hex.substring(prefix.length, prefix.length + 40);
            const implementationAddress = "0x" + addressHex;
            
            console.log("📍 Dirección de implementación:", implementationAddress);
            
            const implCode = await provider.getCode(implementationAddress);
            
            if (implCode !== "0x") {
                console.log("✅ La implementación tiene código!");
                
                const abi = whatsabi.abiFromBytecode(implCode);
                
                if (abi.length > 0) {
                    console.log(`🎉 ¡Encontrado! ${abi.length} funciones:`);
                    console.log(JSON.stringify(abi, null, 2));
                } else {
                    console.log("❌ No se encontraron funciones");
                }
            } else {
                console.log("❌ La implementación no tiene código");
            }
        } else {
            console.log("❌ No es un minimal proxy reconocido");
        }
        
    } catch (error) {
        console.log("❌ Error:", error.message);
    }
}

getABI();
