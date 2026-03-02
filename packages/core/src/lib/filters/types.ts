import { UniRControllerInterface } from '@listedbase/uni-reactive';
// الترتيب التصاعدي أو التنازلي
export type SortOrder = 'asc' | 'desc'

/* -------------------------------
   فلاتر أساسية للأنواع البسيطة
-------------------------------- */

// النصوص
export interface StringWhereInput {
    equals?: string | null
    not?: string | null
    in?: (string | null)[]
    notIn?: (string | null)[]
    lt?: string
    lte?: string
    gt?: string
    gte?: string
    contains?: string
    startsWith?: string
    endsWith?: string
    isNull?: boolean
}

// الأرقام
export interface NumberWhereInput {
    equals?: number | null
    not?: number | null
    in?: (number | null)[]
    notIn?: (number | null)[]
    lt?: number
    lte?: number
    gt?: number
    gte?: number
    isNull?: boolean
}

// التواريخ
export interface DateWhereInput {
    equals?: Date | string | null
    not?: Date | string | null
    in?: (Date | string | null)[]
    notIn?: (Date | string | null)[]
    lt?: Date | string
    lte?: Date | string
    gt?: Date | string
    gte?: Date | string
    isNull?: boolean
}

// القيم المنطقية
export interface BooleanWhereInput {
    equals?: boolean | null
    not?: boolean | null
    isNull?: boolean
}

/* -------------------------------
   الفلاتر المتقدمة
-------------------------------- */

// المصفوفات
export interface ArrayWhereInput<T> {
    equals?: T[] | null
    has?: T
    hasEvery?: T[]
    hasSome?: T[]
    isEmpty?: boolean
    isNull?: boolean
}

// الكائنات (العلاقات / الـ nested objects)
/*export interface ObjectWhereInput<T> {
    [K in keyof T]?: WhereInput<T[K]> | ObjectWhereInput<T[K]>
is ?: ObjectWhereInput<T>
}*/

/* -------------------------------
   فلتر عام ديناميكي
-------------------------------- */

export type WhereInput<T> =
    T extends string ? string | StringWhereInput :
    T extends number ? number | NumberWhereInput :
    T extends boolean ?  BooleanWhereInput :
    T extends Date ? DateWhereInput :
    T extends (infer U)[] ? ArrayWhereInput<U> :
   // T extends object ? ObjectWhereInput<T> :
    never

/* -------------------------------
   الترتيب والاستعلام
-------------------------------- */

export type OrderBy<T> = {
    [K in keyof T]?: SortOrder
}

export interface LFilterInput<T> {
    where?: {
        [K in keyof T]?: WhereInput<T[K]>
    }
    orderBy?: OrderBy<T>
    skip?: number
    take?: number
    include?: {
        [K in keyof T]?: boolean | LFilterInput<any>
    }
    select?: {
        [K in keyof T]?: boolean
    }
}
/*
export interface UniqueFilterInput<T> {
    [K in keyof T]?: T[K] extends string ? StringWhereInput :
        T extends number ? NumberWhereInput : never 
}*/


export interface CreateInput<T> {
    data: T
}



export  type LReactiveFilterType<T> = UniRControllerInterface<LFilterInput<T>, unknown>


