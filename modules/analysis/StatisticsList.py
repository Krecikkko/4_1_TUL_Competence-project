import math


class ZScore:

    def __init__(self):
        self.counts: dict[int, int] = {}
        self.n = 0
        self.total_sum = 0
        self.sum_sq = 0

    def Add(self, x: int) -> None:
        #Modifies an existing item x -> x + 1
        count = self.counts.get(x, 0)
        if(x == 0):
            self.counts[1] = self.counts.get(1, 0) + 1
            self.n += 1
            self.total_sum += 1
            self.sum_sq += 1
        if count == 0:
            raise KeyError(f"Value {x} not in multiset")
        if count == 1:
            del self.counts[x]
        else:
            self.counts[x] = count - 1

        new_x = x + 1
        self.counts[new_x] = self.counts.get(new_x, 0) + 1
        # Algebraic shortcut: (x + 1)^2 - x^2 = 2x + 1
        self.total_sum += 1
        self.sum_sq += 2 * x + 1

    def Low(self, x: int) -> None:
        #Modifies an existing item x -> x - 1; drops it if it hits 0.
        count = self.counts.get(x, 0)
        if count == 0:
            raise KeyError(f"Value {x} not in multiset")
        if count == 1:
            del self.counts[x]
        else:
            self.counts[x] = count - 1

        if x == 1:
            # Item becomes 0 and is removed from the multiset
            self.n -= 1
            self.total_sum -= 1
            self.sum_sq -= 1
        else:
            new_x = x - 1
            self.counts[new_x] = self.counts.get(new_x, 0) + 1
            # Algebraic shortcut: (x - 1)^2 - x^2 = -(2x - 1)
            self.total_sum -= 1
            self.sum_sq -= 2 * x - 1

    def CalcMean(self) -> float:
        if self.n == 0:
            return 0.0
        return self.total_sum / self.n

    def CalcDev(self, ddof: int = 1) -> float:
        if self.n <= ddof:
            return 0.0
        numerator = self.n * self.sum_sq - self.total_sum * self.total_sum
        variance = numerator / (self.n * (self.n - ddof))
        return math.sqrt(max(0.0, variance))

    def CalcZScore(self,value:int) -> float:
        return (value - self.CalcMean()) / self.CalcDev()
