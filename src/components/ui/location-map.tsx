"use client"

import React, { useState, useEffect } from 'react'
import { Address } from './address-manager'
import { ChevronDown, ChevronUp, MapPin, ArrowRight } from 'lucide-react'
import { cn } from '@/lib/utils'

interface LocationMapProps {
  addresses: Address[] | undefined
  address?: string  // Compatibilidade com endereço único
  height?: string
  width?: string
  primaryColor?: string
  hasButton?: boolean
  buttonLabel?: string
  buttonUrl?: string
}

export function LocationMap({ 
  addresses = [],
  address,  // Compatibilidade com versão anterior
  height = '250px',
  width = '100%',
  primaryColor = '#0070df',
  hasButton,
  buttonLabel,
  buttonUrl
}: LocationMapProps) {
  // Se temos apenas o endereço único antigo, convertemos para o formato novo
  const allAddresses = addresses?.length 
    ? addresses 
    : address 
      ? [{ id: 'legacy', name: 'Endereço', address, isDefault: true }] 
      : []

  // Estado para controlar qual endereço está sendo exibido
  const [selectedAddress, setSelectedAddress] = useState<Address | null>(null)
  const [isDropdownOpen, setIsDropdownOpen] = useState(false)

  // Inicializar com o endereço padrão quando carregamos os endereços
  useEffect(() => {
    if (allAddresses.length > 0) {
      // Encontrar o endereço padrão ou usar o primeiro
      const defaultAddress = allAddresses.find(addr => addr.isDefault) || allAddresses[0]
      setSelectedAddress(defaultAddress)
    } else {
      setSelectedAddress(null)
    }
  }, [allAddresses])

  // Validar se o endereço selecionado tem todos os campos necessários
  const isValidAddress = (addr: Address | null): boolean => {
    if (!addr) return false;
    return Boolean(addr.address && addr.address.trim() !== '');
  }

  // Se não houver endereço selecionado ou se o endereço for inválido
  if (!isValidAddress(selectedAddress)) {
    return (
      <div 
        className="rounded-lg overflow-hidden shadow-md flex items-center justify-center bg-gray-50 text-gray-400 text-sm"
        style={{ width, height }}
      >
        Aguardando dados do endereço...
      </div>
    )
  }

  // Neste ponto sabemos que selectedAddress não é null
  const currentAddress = selectedAddress as Address;
  
  // Encode address for URL
  const encodedAddress = encodeURIComponent(currentAddress.address)
  
  return (
    <div className="space-y-2">
      {/* Seletor de endereço - mostrar apenas se houver mais de um */}
      {allAddresses.length > 1 && (
        <div className="relative">
          <div className="flex items-center justify-between">
            <button
              onClick={() => setIsDropdownOpen(!isDropdownOpen)}
              className="flex-1 flex justify-between items-center p-2 border rounded-lg"
              style={{ borderColor: primaryColor + '40' }}
            >
              <div className="flex items-center">
                <MapPin size={16} style={{ color: primaryColor }} className="mr-2" />
                <span className="text-sm font-medium">{currentAddress.name}</span>
              </div>
              {isDropdownOpen ? (
                <ChevronUp size={16} className="text-gray-500" />
              ) : (
                <ChevronDown size={16} className="text-gray-500" />
              )}
            </button>
            {hasButton && buttonLabel && buttonUrl && (
              <a
                href={buttonUrl}
                target="_blank"
                rel="noopener noreferrer"
                className={cn(
                  "ml-2 inline-flex items-center gap-1.5 px-2.5 py-1 text-sm font-normal",
                  "bg-gradient-to-b from-white to-gray-50 border border-gray-200 text-gray-900",
                  "shadow-[0_2px_8px_rgba(0,0,0,0.04)]",
                  "hover:shadow-[0_8px_30px_rgba(0,0,0,0.12)]",
                  "transition-all duration-500",
                  "transform hover:scale-[1.02] active:scale-[0.98]",
                  "rounded-lg"
                )}
              >
                <MapPin className="w-4 h-4" />
                {buttonLabel}
              </a>
            )}
          </div>
          
          {isDropdownOpen && (
            <div className="absolute z-10 w-full mt-1 bg-white border rounded-lg shadow-lg max-h-60 overflow-auto">
              {allAddresses.map(addr => (
                <button
                  key={addr.id}
                  className="w-full text-left px-3 py-2 hover:bg-gray-100 flex items-center"
                  onClick={() => {
                    setSelectedAddress(addr)
                    setIsDropdownOpen(false)
                  }}
                >
                  <div 
                    className={`w-2 h-2 rounded-full mr-2 ${addr.id === currentAddress.id ? 'opacity-100' : 'opacity-0'}`}
                    style={{ backgroundColor: primaryColor }}
                  />
                  <div>
                    <div className="font-medium text-sm">{addr.name}</div>
                    <div className="text-xs text-gray-500 truncate max-w-[250px]">{addr.address}</div>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      )}
      
      {/* Mapa */}
      <div className="rounded-lg overflow-hidden shadow-md" style={{ width, height }}>
        <iframe
          width="100%"
          height="100%"
          frameBorder="0"
          src={`https://maps.google.com/maps?q=${encodedAddress}&t=&z=15&ie=UTF8&iwloc=&output=embed`}
          allowFullScreen
          loading="lazy"
          title={`Localização: ${currentAddress.name}`}
          className="w-full h-full"
        />
      </div>
    </div>
  )
} 